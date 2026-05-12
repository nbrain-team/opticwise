import { Octokit } from "@octokit/rest";

export type RepoFile = {
  path: string;
  content: Buffer | string;
};

function repoConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.INSIGHTS_REPO_OWNER ?? "nbrain-team";
  const repo = process.env.INSIGHTS_REPO_NAME ?? "opticwise-html";
  const branch = process.env.INSIGHTS_REPO_BRANCH ?? "main";
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set");
  }
  return { token, owner, repo, branch };
}

export async function fetchRepoFileUtf8(path: string): Promise<string | null> {
  const { token, owner, repo, branch } = repoConfig();
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (!("content" in data) || Array.isArray(data)) return null;
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export async function pushFilesToRepo(
  files: RepoFile[],
  message: string
): Promise<{ sha: string }> {
  const { token, owner, repo, branch } = repoConfig();
  const octokit = new Octokit({ auth: token });

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const commitSha = refData.object.sha;

  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });
  const baseTreeSha = commitData.tree.sha;

  const treeItems: {
    path: string;
    mode: "100644";
    type: "blob";
    sha: string;
  }[] = [];

  for (const f of files) {
    const contentBuffer =
      typeof f.content === "string"
        ? Buffer.from(f.content, "utf8")
        : f.content;
    const { data: blob } = await octokit.rest.git.createBlob({
      owner,
      repo,
      content: contentBuffer.toString("base64"),
      encoding: "base64",
    });
    treeItems.push({
      path: f.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [commitSha],
  });

  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return { sha: newCommit.sha };
}
