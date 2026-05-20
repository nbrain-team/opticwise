const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const REPO_OWNER = "nbrain-team"
const REPO_NAME = "opticwise-html"
const BRANCH = "main"
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`

interface GitHubFileResult {
  sha: string
  content: string
}

async function getFile(path: string): Promise<GitHubFileResult | null> {
  const res = await fetch(`${BASE_URL}/contents/${path}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub getFile failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return {
    sha: data.sha,
    content: Buffer.from(data.content, "base64").toString("utf-8"),
  }
}

async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${BASE_URL}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub putFile failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content.sha as string
}

export interface PublishResult {
  postSha: string
  indexSha: string
}

export async function publishPostToGitHub(
  slug: string,
  postHtml: string,
  indexCardHtml: string,
  title: string
): Promise<PublishResult> {
  // 1. Commit the new post file (new directory — never overwrites existing posts)
  const postPath = `insights/${slug}/index.html`
  const existingPost = await getFile(postPath)
  const postSha = await putFile(
    postPath,
    postHtml,
    `feat(blog): publish "${title}"`,
    existingPost?.sha
  )

  // 2. Update insights/index.html — insert new card at top of the grid (surgical insert only)
  const indexFile = await getFile("insights/index.html")
  if (!indexFile) throw new Error("insights/index.html not found in repo")

  const GRID_MARKER = "data-ow-insights-grid>"
  const markerIdx = indexFile.content.indexOf(GRID_MARKER)
  if (markerIdx === -1) throw new Error("Could not find grid marker in insights/index.html")

  // Only insert the new card — nothing existing is removed or modified
  const insertAt = markerIdx + GRID_MARKER.length
  const updatedIndex =
    indexFile.content.slice(0, insertAt) + indexCardHtml + indexFile.content.slice(insertAt)

  const indexSha = await putFile(
    "insights/index.html",
    updatedIndex,
    `feat(blog): add card for "${title}" to insights index`,
    indexFile.sha
  )

  return { postSha, indexSha }
}

export async function unpublishPostFromGitHub(slug: string, title: string): Promise<void> {
  // Remove the post card from insights/index.html
  const indexFile = await getFile("insights/index.html")
  if (!indexFile) return

  // Remove the card by finding its slug anchor and removing the full <a> element
  const slugAttr = `data-ow-slug="${slug}"`
  const cardStart = indexFile.content.indexOf(`<a class="group block`, indexFile.content.indexOf(slugAttr) - 500)
  if (cardStart === -1) return

  // Find the matching </a> close
  const cardEnd = indexFile.content.indexOf("</a>", cardStart) + 4
  const updatedIndex = indexFile.content.slice(0, cardStart) + indexFile.content.slice(cardEnd)

  await putFile(
    "insights/index.html",
    updatedIndex,
    `feat(blog): remove card for "${title}" from insights index`,
    indexFile.sha
  )
}
