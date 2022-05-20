import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
  Form,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import { removeUser } from './chat.server'
import { destroySession, getSession } from './session.server'

interface LoaderData {
  user?: string
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'))

  if (session.has('user')) {
    return json<LoaderData>({ user: session.get('user') })
  }

  return json<LoaderData>({})
}

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  if (formData.has('logout')) {
    removeUser(session.get('user'))
    return redirect('/', {
      headers: { 'Set-Cookie': await destroySession(session) },
    })
  }
  return null
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
  viewport: 'width=device-width,initial-scale=1',
})

export default function App() {
  const loaderData = useLoaderData<LoaderData>()
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {loaderData.user ? (
          <Form method="post">
            <button
              type="submit"
              name="logout"
              value="true"
              title={`${loaderData.user}, log out`}
            >
              Logout
            </button>
          </Form>
        ) : null}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
