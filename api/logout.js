export default function handler(req, res) {
  res.setHeader(
    'Set-Cookie',
    'mm_auth=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  );
  res.writeHead(302, { Location: '/login.html' });
  res.end();
}
