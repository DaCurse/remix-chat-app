import { createCookieSessionStorage } from '@remix-run/node'

const DEFAULT_SECRET = 'y9q*uMGmx3Aw'

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: '__session',
      httpOnly: true,
      expires: new Date(Date.now() + 3_600_000), // In 1 hour
      maxAge: 3_600, // 1 Hour
      path: '/',
      sameSite: 'lax',
      secrets: [process.env.SESSION_SECRET || DEFAULT_SECRET],
      secure: true,
    },
  })

export { getSession, commitSession, destroySession }
