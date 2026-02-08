const { verifyToken } = require('./auth');

const GITHUB_API = 'https://api.github.com';
const OWNER = process.env.GITHUB_OWNER || 'harriganeli-source';
const REPO = process.env.GITHUB_REPO || 'portfolio';
const BRANCH = 'main';

async function ghFetch(path, options = {}) {
  const url = `${GITHUB_API}/repos/${OWNER}/${REPO}${path}`;
  const r = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`GitHub ${options.method || 'GET'} ${path}: ${r.status} ${text}`);
  }
  return r.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { files, deletedFiles, message } = req.body;
    // files: [{ path: 'index.html', content: '...' }, ...]
    // deletedFiles: ['projects/old.html', ...]
    // message: 'commit message'

    if ((!files || files.length === 0) && (!deletedFiles || deletedFiles.length === 0)) {
      return res.status(400).json({ error: 'No changes to publish' });
    }

    // 1. Get the current commit SHA for the branch
    const ref = await ghFetch(`/git/refs/heads/${BRANCH}`);
    const latestCommitSha = ref.object.sha;

    // 2. Get the tree of the latest commit
    const commit = await ghFetch(`/git/commits/${latestCommitSha}`);
    const baseTreeSha = commit.tree.sha;

    // 3. Create blobs for each file
    const treeItems = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.encoding === 'base64') {
          // Binary file (image)
          const blob = await ghFetch('/git/blobs', {
            method: 'POST',
            body: JSON.stringify({
              content: file.content,
              encoding: 'base64',
            }),
          });
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          });
        } else {
          // Text file
          const blob = await ghFetch('/git/blobs', {
            method: 'POST',
            body: JSON.stringify({
              content: file.content,
              encoding: 'utf-8',
            }),
          });
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          });
        }
      }
    }

    // Handle deleted files
    if (deletedFiles && deletedFiles.length > 0) {
      for (const path of deletedFiles) {
        treeItems.push({
          path,
          mode: '100644',
          type: 'blob',
          sha: null, // null SHA = delete
        });
      }
    }

    // 4. Create a new tree
    const newTree = await ghFetch('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    // 5. Create the commit
    const commitMsg = message || `Update from admin panel — ${new Date().toLocaleString()}`;
    const newCommit = await ghFetch('/git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: commitMsg,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    // 6. Update the branch reference
    await ghFetch(`/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommit.sha,
      }),
    });

    return res.status(200).json({
      success: true,
      commitSha: newCommit.sha,
      commitUrl: `https://github.com/${OWNER}/${REPO}/commit/${newCommit.sha}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
