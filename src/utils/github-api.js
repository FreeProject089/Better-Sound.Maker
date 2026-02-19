/**
 * github-api.js — GitHub REST API wrapper for Better Sound.Maker collaboration
 *
 * Uses the GitHub Contents API to read/write files in a repository.
 * No Git CLI needed. PAT is stored in localStorage only.
 */

const GH_API = 'https://api.github.com';

function headers(pat) {
    return {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
    };
}

/**
 * Test PAT + repo access.
 * @param {string} pat - GitHub Personal Access Token
 * @param {string} repo - "owner/repo"
 * @returns {Promise<{ok: boolean, user?: string, error?: string}>}
 */
export async function testConnection(pat, repo) {
    try {
        const [userRes, repoRes] = await Promise.all([
            fetch(`${GH_API}/user`, { headers: headers(pat) }),
            fetch(`${GH_API}/repos/${repo}`, { headers: headers(pat) }),
        ]);
        if (!userRes.ok) return { ok: false, error: `Auth failed: ${userRes.status}` };
        if (!repoRes.ok) return { ok: false, error: `Repo not accessible: ${repoRes.status}` };
        const user = await userRes.json();
        const repoData = await repoRes.json();
        return { ok: true, user: user.login, repoName: repoData.full_name };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

/**
 * Get a file from the repo (returns content + sha for updates).
 * @param {string} pat
 * @param {string} repo - "owner/repo"
 * @param {string} filePath - path in repo e.g. "project.json"
 * @returns {Promise<{content: string, sha: string} | null>}
 */
export async function getFile(pat, repo, filePath) {
    const res = await fetch(`${GH_API}/repos/${repo}/contents/${filePath}`, {
        headers: headers(pat),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
    const data = await res.json();
    // For text, we usually decode. For binary, we might want the raw base64 or a blob.
    // Making this versatile: return consistent object
    const content = atob(data.content.replace(/\n/g, ''));
    return { content, sha: data.sha, contentBase64: data.content };
}

/**
 * Put (create or update) a file in the repo.
 * @param {string} pat
 * @param {string} repo
 * @param {string} filePath
 * @param {string} content - raw string content
 * @param {string} message - commit message
 * @param {string|null} sha - existing file SHA if updating
 * @returns {Promise<{commit: object}>}
 */
export async function putFile(pat, repo, filePath, content, message, sha = null) {
    const body = {
        message,
        content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${GH_API}/repos/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: headers(pat),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub PUT failed: ${res.status}`);
    }
    return res.json();
}

/**
 * Upload a binary file (ArrayBuffer) to the repo.
 * @param {string} pat
 * @param {string} repo
 * @param {string} filePath
 * @param {ArrayBuffer} arrayBuffer
 * @param {string} message
 * @param {string|null} sha
 */
export async function putBinaryFile(pat, repo, filePath, arrayBuffer, message, sha = null) {
    // Convert ArrayBuffer to Base64 string manually to handle binary data correctly
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const contentBase64 = btoa(binary);

    const body = {
        message,
        content: contentBase64,
        encoding: 'base64' // Explicitly state encoding, though GitHub assumes base64 for content
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${GH_API}/repos/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: headers(pat),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub PUT Binary failed: ${res.status}`);
    }
    return res.json();
}

/**
 * Push the current project state to the repo as project.json.
 * @param {string} pat
 * @param {string} repo
 * @param {object} state - serializable project state
 * @param {string} username - current user display name
 * @returns {Promise<{ok: boolean, sha?: string, error?: string}>}
 */
export async function pushProjectState(pat, repo, state, username) {
    try {
        const content = JSON.stringify(state, null, 2);
        const message = `sync: ${username} @ ${new Date().toISOString()}`;
        const existing = await getFile(pat, repo, 'project.json');
        const result = await putFile(pat, repo, 'project.json', content, message, existing?.sha ?? null);
        return { ok: true, sha: result.commit.sha };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

/**
 * Pull the project state from the repo.
 * @param {string} pat
 * @param {string} repo
 * @returns {Promise<{ok: boolean, state?: object, error?: string}>}
 */
export async function pullProjectState(pat, repo) {
    try {
        const file = await getFile(pat, repo, 'project.json');
        if (!file) return { ok: false, error: 'No project.json found in repo' };
        const state = JSON.parse(file.content);
        return { ok: true, state };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

/**
 * Push a note to notes/<username>-<timestamp>.json
 * @param {string} pat
 * @param {string} repo
 * @param {string} username
 * @param {string} text - note content
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function pushNote(pat, repo, username, text) {
    try {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = `notes/${username}-${ts}.json`;
        const content = JSON.stringify({
            author: username,
            date: new Date().toISOString(),
            text,
        }, null, 2);
        await putFile(pat, repo, filePath, content, `note: ${username} @ ${ts}`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

/**
 * List all notes from the notes/ directory.
 * @param {string} pat
 * @param {string} repo
 * @returns {Promise<Array<{name, author, date, text}>>}
 */
export async function listNotes(pat, repo) {
    try {
        const res = await fetch(`${GH_API}/repos/${repo}/contents/notes`, {
            headers: headers(pat),
        });
        if (res.status === 404) return [];
        if (!res.ok) throw new Error(`List notes failed: ${res.status}`);
        const files = await res.json();

        const notes = await Promise.all(
            files
                .filter(f => f.name.endsWith('.json'))
                .map(async (f) => {
                    const noteFile = await getFile(pat, repo, f.path);
                    if (!noteFile) return null;
                    try {
                        return JSON.parse(noteFile.content);
                    } catch { return null; }
                })
        );
        return notes.filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        return [];
    }
}

/**
 * Get commit history for a file.
 * @param {string} pat
 * @param {string} repo
 * @param {string} filePath
 * @returns {Promise<Array<{sha, message, author, date}>>}
 */
export async function getCommitLog(pat, repo, filePath = 'project.json') {
    try {
        const res = await fetch(`${GH_API}/repos/${repo}/commits?path=${filePath}&per_page=20`, {
            headers: headers(pat),
        });
        if (!res.ok) return [];
        const commits = await res.json();
        return commits.map(c => ({
            sha: c.sha,
            message: c.commit.message,
            author: c.commit.author.name,
            date: c.commit.author.date,
        }));
    } catch { return []; }
}

/**
 * Get the project.json state at a specific commit SHA.
 * @param {string} pat
 * @param {string} repo
 * @param {string} sha - commit SHA
 * @returns {Promise<object|null>}
 */
export async function getStateAtCommit(pat, repo, sha) {
    try {
        // Get tree at commit
        const commitRes = await fetch(`${GH_API}/repos/${repo}/git/commits/${sha}`, {
            headers: headers(pat),
        });
        if (!commitRes.ok) return null;
        const commit = await commitRes.json();

        // Get project.json blob
        const treeRes = await fetch(`${GH_API}/repos/${repo}/git/trees/${commit.tree.sha}?recursive=1`, {
            headers: headers(pat),
        });
        if (!treeRes.ok) return null;
        const tree = await treeRes.json();
        const projectFile = tree.tree.find(f => f.path === 'project.json');
        if (!projectFile) return null;

        const blobRes = await fetch(`${GH_API}/repos/${repo}/git/blobs/${projectFile.sha}`, {
            headers: headers(pat),
        });
        if (!blobRes.ok) return null;
        const blob = await blobRes.json();
        const content = atob(blob.content.replace(/\n/g, ''));
        return JSON.parse(content);
    } catch { return null; }
}
