import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Done'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'High'],
      default: 'Low',
    },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
