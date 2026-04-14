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
    // Join a conversation room
    socket.on('join', (conversationId: string) => {
      socket.join(conversationId)
    })

    // Leave a conversation room
    socket.on('leave', (conversationId: string) => {
      socket.leave(conversationId)
    })

    // Broadcast new message to everyone in the room except sender
    socket.on('message', (data: { conversationId: string; message: any }) => {
      socket.to(data.conversationId).emit('message', data.message)
    })
  })

  const port = parseInt(process.env.PORT || '3000', 10)
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
