export const config = {
  matcher: ['/((?!login\\.html$|api/|public/).*)'],
};

export default function middleware(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';')
      .filter(Boolean)
      .map(c => {
        const idx = c.indexOf('=');
        return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
      })
  );

  if (cookies['mm_auth'] !== process.env.AUTH_TOKEN) {
    return Response.redirect(new URL('/login.html', request.url), 302);
  }
}
