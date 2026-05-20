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

/** Removes ALL cards for a given slug from the index HTML. Returns the cleaned content. */
function removeAllCardsForSlug(content: string, slug: string): string {
  const slugAttr = `data-ow-slug="${slug}"`
  let result = content
  // Loop until no more cards with this slug remain
  while (result.includes(slugAttr)) {
    const slugPos = result.indexOf(slugAttr)
    // Walk backward to the opening <a tag (match the specific card class)
    const openTag = '<a class="group block'
    let cardStart = slugPos
    while (cardStart > 0 && result.slice(cardStart, cardStart + openTag.length) !== openTag) {
      cardStart--
    }
    // Walk forward to the matching </a>
    const closeTag = "</a>"
    const rawEnd = result.indexOf(closeTag, slugPos)
    if (rawEnd === -1) break // safety
    const cardEnd = rawEnd + closeTag.length
    result = result.slice(0, cardStart) + result.slice(cardEnd)
  }
  return result
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
  const indexFile = await getFile("insights/index.html")
  if (!indexFile) throw new Error("insights/index.html not found in repo")

  const GRID_MARKER = "data-ow-insights-grid>"
  const markerIdx = indexFile.content.indexOf(GRID_MARKER)
  if (markerIdx === -1) throw new Error("Could not find grid marker in insights/index.html")

  // Remove any existing cards for this slug first (deduplicates on republish)
  const deduped = removeAllCardsForSlug(indexFile.content, slug)

  // Prepend the fresh card at the top of the grid
  const insertAt = deduped.indexOf(GRID_MARKER) + GRID_MARKER.length
  const updatedIndex = deduped.slice(0, insertAt) + indexCardHtml + deduped.slice(insertAt)

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
  const indexFile = await getFile("insights/index.html")
  if (!indexFile) throw new Error("insights/index.html not found in repo")

  // Remove ALL cards for this slug (handles edge case of duplicate cards)
  const updatedIndex = removeAllCardsForSlug(indexFile.content, slug)

  // Atomically: delete the post file + clean the index — one Render deploy
  await commitMultipleFiles(
    [
      { path: `insights/${slug}/index.html`, content: null },
      { path: "insights/index.html", content: updatedIndex },
    ],
    `feat(blog): delete "${title}"`
  )
}
