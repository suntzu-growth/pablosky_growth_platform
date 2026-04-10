export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user, pass } = req.body || {};

  const users = JSON.parse(process.env.AUTH_USERS || '[]');
  const valid = users.some(u => u.user === user && u.pass === pass);

  if (valid) {
    res.setHeader(
      'Set-Cookie',
      `mm_auth=${process.env.AUTH_TOKEN}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
    );
    return res.status(200).json({ ok: true });
  }

  res.status(401).json({ ok: false });
}
