import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId
  sender: mongoose.Types.ObjectId
  text: string
  deleted: boolean
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema)
