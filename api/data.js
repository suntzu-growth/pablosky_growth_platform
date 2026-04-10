const https = require("https");

const TOKEN    = process.env.GITHUB_TOKEN;
const OWNER    = process.env.GITHUB_OWNER;
const REPO     = process.env.GITHUB_REPO;
const FILE     = process.env.GITHUB_FILE_PATH || "data/leadership.json";

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.github.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "miller-marc-leadership",
        "Content-Type": "application/json",
        ...(payload && { "Content-Length": Buffer.byteLength(payload) }),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const apiPath = `/repos/${OWNER}/${REPO}/contents/${FILE}`;

  // ── GET: leer el JSON guardado ──────────────────────────────────────────────
  if (req.method === "GET") {
    const result = await githubRequest("GET", apiPath);
    if (result.status === 404) {return res.status(200).json({ priorities: [] });}
    if (result.status !== 200) return res.status(502).json({ error: "GitHub API error", detail: result.body });
    const content = Buffer.from(result.body.content, "base64").toString("utf-8");
    return res.status(200).json(JSON.parse(content));
  }

  // ── POST: guardar el JSON ───────────────────────────────────────────────────
  if (req.method === "POST") {
    // Leer body del request
    const raw = await new Promise((resolve, reject) => {
      let buf = "";
      req.on("data", (c) => (buf += c));
      req.on("end", () => resolve(buf));
      req.on("error", reject);
    });

    // Obtener SHA del archivo actual (necesario para actualizarlo)
    const current = await githubRequest("GET", apiPath);
    const sha = current.status === 200 ? current.body.sha : undefined;

    const payload = {
      message: "chore: update leadership data",
      content: Buffer.from(raw).toString("base64"),
      ...(sha && { sha }),
    };

    const result = await githubRequest("PUT", apiPath, payload);

    if (result.status === 200 || result.status === 201) {
      return res.status(200).json({ ok: true });
    }
    return res.status(502).json({ error: "Failed to save", detail: result.body });
  }

  res.status(405).json({ error: "Method not allowed" });
};
