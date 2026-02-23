import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Device', 'Software', 'Feature'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: [{ type: String }],
    specifications: {
      type: Map,
      of: String,
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Full-text index — used by replyEnquiryNode to match user queries
productSchema.index(
  { name: 'text', description: 'text', features: 'text', tags: 'text' },
  { weights: { name: 10, tags: 8, features: 5, description: 3 } }
);

export const Product = mongoose.model('Product', productSchema);

export default Product;
