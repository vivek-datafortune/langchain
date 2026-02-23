import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
      index: true
    },
    title: {
      type: String,
      default: 'New Conversation'
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true
        },
        content: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    metadata: {
      model: {
        type: String,
        default: 'gemini-pro'
      },
      temperature: Number,
      topP: Number,
      topK: Number
    }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
