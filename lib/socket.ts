import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
    })
  }
  return socket
}

// Call this once after login to register the user's personal room
export function registerUser(userId: string) {
  getSocket().emit('register', userId)
}
