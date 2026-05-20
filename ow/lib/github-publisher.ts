const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const REPO_OWNER = "nbrain-team"
const REPO_NAME = "opticwise-html"
const BRANCH = "main"
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`

function ghHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

async function getFile(path: string): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(`${BASE_URL}/contents/${path}?ref=${BRANCH}`, {
    headers: ghHeaders(),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub getFile(${path}) failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return {
    sha: data.sha,
    content: Buffer.from(data.content, "base64").toString("utf-8"),
  }
}

/** Commits multiple file changes atomically in a single Git commit — one Render deploy trigger.
 *  Set content to null to delete a file. */
async function commitMultipleFiles(
  files: Array<{ path: string; content: string | null; isBinary?: boolean }>,
  message: string
): Promise<void> {
  // 1. Get the current HEAD commit SHA
  const branchRes = await fetch(`${BASE_URL}/git/ref/heads/${BRANCH}`, { headers: ghHeaders() })
  if (!branchRes.ok)
    throw new Error(`getRef failed: ${branchRes.status} ${await branchRes.text()}`)
  const branchData = await branchRes.json()
  const headSha: string = branchData.object.sha

  // 2. Get the base tree SHA
  const commitRes = await fetch(`${BASE_URL}/git/commits/${headSha}`, { headers: ghHeaders() })
  if (!commitRes.ok)
    throw new Error(`getCommit failed: ${commitRes.status} ${await commitRes.text()}`)
  const commitData = await commitRes.json()
  const baseTreeSha: string = commitData.tree.sha

  // 3. Create blobs for each file (skip for deletions)
  const treeItems = await Promise.all(
    files.map(async (file) => {
      if (file.content === null) {
        // Null SHA = delete this path from the tree
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: null,
        }
      }
      const blobRes = await fetch(`${BASE_URL}/git/blobs`, {
        method: "POST",
        headers: ghHeaders(),
        body: JSON.stringify({
          content: file.isBinary
            ? file.content
            : Buffer.from(file.content, "utf-8").toString("base64"),
          encoding: "base64",
        }),
      })
      if (!blobRes.ok)
        throw new Error(`createBlob(${file.path}) failed: ${blobRes.status} ${await blobRes.text()}`)
      const blobData = await blobRes.json()
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blobData.sha as string,
      }
    })
  )

  // 4. Create a new tree
  const treeRes = await fetch(`${BASE_URL}/git/trees`, {
    method: "POST",
    headers: ghHeaders(),
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  })
  if (!treeRes.ok)
    throw new Error(`createTree failed: ${treeRes.status} ${await treeRes.text()}`)
  const treeData = await treeRes.json()

  // 5. Create the commit
  const newCommitRes = await fetch(`${BASE_URL}/git/commits`, {
    method: "POST",
    headers: ghHeaders(),
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [headSha],
    }),
  })
  if (!newCommitRes.ok)
    throw new Error(`createCommit failed: ${newCommitRes.status} ${await newCommitRes.text()}`)
  const newCommitData = await newCommitRes.json()

  // 6. Update the branch reference
  const updateRefRes = await fetch(`${BASE_URL}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    headers: ghHeaders(),
    body: JSON.stringify({ sha: newCommitData.sha }),
  })
  if (!updateRefRes.ok)
    throw new Error(`updateRef failed: ${updateRefRes.status} ${await updateRefRes.text()}`)
}

export interface PublishResult {
  liveUrl: string
}

export async function publishPostToGitHub(
  slug: string,
  postHtml: string,
  indexCardHtml: string,
  title: string
): Promise<PublishResult> {
  // Read current insights/index.html
  const indexFile = await getFile("insights/index.html")
  if (!indexFile) throw new Error("insights/index.html not found in repo")

  const GRID_MARKER = "data-ow-insights-grid>"
  const markerIdx = indexFile.content.indexOf(GRID_MARKER)
  if (markerIdx === -1) throw new Error("Could not find grid marker in insights/index.html")

  // Surgical insert: prepend the new card — existing content untouched
  const insertAt = markerIdx + GRID_MARKER.length
  const updatedIndex =
    indexFile.content.slice(0, insertAt) + indexCardHtml + indexFile.content.slice(insertAt)

  // Commit BOTH files atomically in one commit → single Render deploy, no race condition
  await commitMultipleFiles(
    [
      { path: `insights/${slug}/index.html`, content: postHtml },
      { path: "insights/index.html", content: updatedIndex },
    ],
    `feat(blog): publish "${title}"`
  )

  return { liveUrl: `https://www.opticwise.com/insights/${slug}/` }
}

export async function uploadImageToGitHub(
  filename: string,
  base64Content: string
): Promise<string> {
  await commitMultipleFiles(
    [{ path: `api/media/file/${filename}`, content: base64Content, isBinary: true }],
    `feat(blog): upload image ${filename}`
  )
  return `https://www.opticwise.com/api/media/file/${encodeURIComponent(filename)}`
}

export async function deletePostFromGitHub(slug: string, title: string): Promise<void> {
  // Read current insights/index.html
  const indexFile = await getFile("insights/index.html")
  if (!indexFile) throw new Error("insights/index.html not found in repo")

  // Remove this post's card surgically — only the matching <a> element is removed
  const slugAttr = `data-ow-slug="${slug}"`
  const slugPos = indexFile.content.indexOf(slugAttr)

  let updatedIndex = indexFile.content

  if (slugPos !== -1) {
    // Walk backward from the slug attribute to find the opening <a
    const openTag = "<a "
    let cardStart = slugPos
    while (cardStart > 0 && indexFile.content.slice(cardStart, cardStart + 3) !== openTag) {
      cardStart--
    }
    // Walk forward to find the closing </a>
    const closeTag = "</a>"
    const cardEnd = indexFile.content.indexOf(closeTag, slugPos) + closeTag.length
    if (cardEnd > closeTag.length) {
      updatedIndex =
        indexFile.content.slice(0, cardStart) + indexFile.content.slice(cardEnd)
    }
  }

  // Commit atomically: delete post file + update index (card removed)
  await commitMultipleFiles(
    [
      { path: `insights/${slug}/index.html`, content: null }, // delete
      { path: "insights/index.html", content: updatedIndex },  // card removed
    ],
    `feat(blog): delete "${title}"`
  )
}
