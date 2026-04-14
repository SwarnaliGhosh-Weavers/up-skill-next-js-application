import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id)

    // Each user joins their own personal room using their userId
    // This way they receive messages even if they haven't opened the conversation
    socket.on('register', (userId: string) => {
      socket.join(userId)
      console.log(`👤 ${socket.id} registered as user: ${userId}`)
    })

    // Join a conversation room (when user opens a chat)
    socket.on('join', (conversationId: string) => {
      socket.join(conversationId)
      console.log(`📥 ${socket.id} joined room: ${conversationId}`)
    })

    // Leave a conversation room (when user switches chat)
    socket.on('leave', (conversationId: string) => {
      socket.leave(conversationId)
      console.log(`📤 ${socket.id} left room: ${conversationId}`)
    })

    // When a message is sent:
    // 1. Emit to the conversation room (for users who have the chat open)
    // 2. Emit to each member's personal room (for users who haven't opened the chat)
    socket.on('message', (data: {
      conversationId: string
      message: any
      memberIds: string[]  // all members of the conversation
    }) => {
      console.log(`💬 Message in room ${data.conversationId} from ${socket.id}`)

      // Send to conversation room (receiver who has chat open gets it here)
      socket.to(data.conversationId).emit('message', data.message)

      // Send to each member's personal room (receiver who hasn't opened chat gets it here)
      // This ensures sidebar updates and notification even without opening the chat
      data.memberIds.forEach((memberId) => {
        socket.to(memberId).emit('new_message', {
          conversationId: data.conversationId,
          message: data.message,
        })
      })
    })

    socket.on('delete_message', (data: { conversationId: string; messageId: string; memberIds: string[] }) => {
      // Notify users who have the chat open
      socket.to(data.conversationId).emit('delete_message', { messageId: data.messageId })
      // Notify users who don't have the chat open (via personal room)
      data.memberIds?.forEach((memberId) => {
        socket.to(memberId).emit('delete_message_notify', {
          conversationId: data.conversationId,
          messageId: data.messageId,
        })
      })
    })

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id)
    })
  })

  const port = parseInt(process.env.PORT || '3000', 10)
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
