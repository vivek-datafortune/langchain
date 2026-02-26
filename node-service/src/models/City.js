import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    state_name: {
      type: String,
      trim: true,
    },
    country_name: {
      type: String,
      trim: true,
    },
    state_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: true,
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    unique_id: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const City = mongoose.model('City', citySchema);
export default City;
