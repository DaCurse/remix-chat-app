import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { Form, useTransition } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '~/chat'
import { getSessionUser, sendMessage } from '~/chat.server'

const MAX_MESSAGE_LENGTH = 256

export const loader: LoaderFunction = async ({ request }) => {
  return await getSessionUser(request)
}

export const action: ActionFunction = async ({ request }) => {
  const user = await getSessionUser(request)
  const formData = await request.formData()

  const message = String(formData.get('message')).slice(0, MAX_MESSAGE_LENGTH)
  if (message.length > 0) {
    sendMessage(user, message)
  }

  return null
}

export default function Chat() {
  const transition = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

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
      setMessages(messages => [
        ...messages,
        { user: 'System', message: `"${event.data}" joined the chat` },
      ])
    })

    eventSource.addEventListener('user-left', event => {
      setMessages(messages => [
        ...messages,
        { user: 'System', message: `"${event.data}" left the chat` },
      ])
    })
    return () => eventSource.close()
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Remix Chat</h1>
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
        <button type="submit">Send</button>
      </Form>
    </main>
  )
}
