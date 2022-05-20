import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useTransition } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '~/chat'
import { getSessionUser, getUsers, sendMessage } from '~/chat.server'
import { destroySession, getSession } from '~/session.server'

const MAX_MESSAGE_LENGTH = 256

interface LoaderData {
  user: string
  users: string[]
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getSessionUser(request)
  return json<LoaderData>({ user, users: getUsers() })
}

export const action: ActionFunction = async ({ request }) => {
  const user = await getSessionUser(request)
  const formData = await request.formData()
  const action = String(formData.get('_action'))

  if (action === 'logout') {
    const session = await getSession(request.headers.get('Cookie'))
    return redirect('/', {
      headers: { 'Set-Cookie': await destroySession(session) },
    })
  }

  if (action === 'send-message') {
    const message = String(formData.get('message')).slice(0, MAX_MESSAGE_LENGTH)
    if (message.length > 0) {
      sendMessage(user, message)
    }
  }

  return null
}

export default function Chat() {
  const loaderData = useLoaderData<LoaderData>()
  const transition = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<Set<string>>(
    () => new Set(loaderData.users)
  )

  useEffect(() => {
    if (transition.state === 'submitting') {
      formRef.current?.reset()
    }
  }, [transition.state])

  useEffect(() => {
    const eventSource = new EventSource('/live/chat')

    eventSource.addEventListener('message', event => {
      const data = JSON.parse(event.data)
      setMessages(messages => [
        ...messages,
        { user: data.user, message: data.message },
      ])
    })

    eventSource.addEventListener('user-joined', event => {
      const user = event.data

      setUsers(users => new Set([...users, user]))
      setMessages(messages => [
        ...messages,
        { user: 'System', message: `"${user}" joined the chat` },
      ])
    })

    eventSource.addEventListener('user-left', event => {
      const user = event.data

      setUsers(users => new Set([...users].filter(u => u !== user)))
      setMessages(messages => [
        ...messages,
        { user: 'System', message: `"${user}" left the chat` },
      ])
    })

    return () => eventSource.close()
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <header style={{ marginBlock: '1rem' }}>
        <h1 style={{ marginBlock: '0' }}>Remix Chat</h1>
        <Form method="post">
          <button
            type="submit"
            name="_action"
            value="logout"
            title={`${loaderData.user}, log out`}
          >
            Logout
          </button>
        </Form>
      </header>
      <section>
        <div>
          Logged in as <strong>{loaderData.user}</strong>
        </div>
        <div title={`Users: ${[...users].join(', ')}`}>
          <strong>{users.size}</strong> Logged in users
        </div>
      </section>
      <section>
        <ul>
          {messages.map(({ user, message }, index) => (
            <li key={index}>
              <strong>{user}: </strong>
              {message}
            </li>
          ))}
        </ul>
        <Form ref={formRef} method="post" replace>
          <input type="text" name="message" />
          <button type="submit" name="_action" value="send-message">
            Send
          </button>
        </Form>
      </section>
    </main>
  )
}
