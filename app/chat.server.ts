import { redirect } from '@remix-run/node'
import LRUCache from 'lru-cache'
import { EventEmitter } from 'node:events'
import { getSession } from './session.server'

declare global {
  var users: LRUCache<string, undefined>
  var chatEvents: EventEmitter
}

global.users =
  global.users ||
  new LRUCache({
    max: 100,
    ttl: 3_600_000,
  })
global.chatEvents = global.chatEvents || new EventEmitter()

export const chat = chatEvents

/**
 * Checks if a user is currently logged in, and if not, redirects to the login page.
 * If the user is logged in, returns the user's name.
 */
export async function getSessionUser(request: Request): Promise<string> {
  const session = await getSession(request.headers.get('Cookie'))
  if (!session.get('user')) throw redirect('/')
  return session.get('user')
}

/**
 * Adds a user to the chat.
 */
export function addUser(user: string) {
  users.set(user, undefined)
  chatEvents.emit('user-joined', user)
}

/**
 * Removes a user from the chat.
 */
export function removeUser(user: string) {
  users.delete(user)
  chatEvents.emit('user-left', user)
}

/**
 * Checks if a user is currently logged in.
 */
export function doesUserExist(user: string) {
  return users.has(user)
}

/**
 * Returns a list of all users currently logged in.
 */
export function getUsers() {
  return Array.from(users.keys())
}

/**
 * Sends a message to the chat on behalf of a user
 */
export function sendMessage(user: string, message: string) {
  chatEvents.emit('message', { user, message })
}
