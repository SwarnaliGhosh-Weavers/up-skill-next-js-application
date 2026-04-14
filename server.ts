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

    // Join a conversation room
    socket.on('join', (conversationId: string) => {
      socket.join(conversationId)
      console.log(`📥 ${socket.id} joined room: ${conversationId}`)
    })

    // Leave a conversation room
    socket.on('leave', (conversationId: string) => {
      socket.leave(conversationId)
      console.log(`📤 ${socket.id} left room: ${conversationId}`)
    })

    // Broadcast new message to everyone in the room except sender
    socket.on('message', (data: { conversationId: string; message: any }) => {
      console.log(`💬 Message in room ${data.conversationId} from ${socket.id}`)
      socket.to(data.conversationId).emit('message', data.message)
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
