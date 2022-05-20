import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { addUser, doesUserExist } from '~/chat.server'
import { commitSession, getSession } from '~/session.server'

interface ActionData {
  error?: string
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'))
  if (session.has('user')) {
    throw redirect('/chat')
  }
  return null
}

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()

  const user = String(formData.get('user'))
  if (user.toLowerCase() === 'system' || doesUserExist(user)) {
    return json<ActionData>({ error: 'User already exists' })
  }

  addUser(user)
  session.set('user', user)

  return redirect('/chat', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}

export default function Index() {
  const actionData = useActionData<ActionData>()
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Remix Chat</h1>
      <Form method="post">
        <input type="text" name="user" placeholder="Username" />
        <button type="submit">Join</button>
      </Form>
      {actionData?.error ? (
        <div style={{ color: 'red' }}>{actionData.error}</div>
      ) : null}
    </main>
  )
}
