import mongoose, { Schema, Document } from 'mongoose'

export interface IConversation extends Document {
  name?: string
  isGroup: boolean
  members: mongoose.Types.ObjectId[]
  lastMessage?: string
  lastMessageAt?: Date
  createdAt: Date
}

const ConversationSchema = new Schema<IConversation>({
  name: { type: String },
  isGroup: { type: Boolean, default: false },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String },
  lastMessageAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema)
