import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clinic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      required: true,
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
    user_data: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      gender: { type: String, trim: true },
      mobile: { type: String, trim: true },
    },
    clinic_data: {
      name: { type: String, trim: true },
    },
    test_type: {
      type: String,
      trim: true,
    },
    hba1c: {
      type: String,
      trim: true,
    },
    hba1c_result: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    hba1c_value: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

testSchema.index({ clinic_id: 1, created_at: -1 });
testSchema.index({ clinic_id: 1, user_id: 1 });
testSchema.index({ clinic_id: 1, test_type: 1 });
testSchema.index({ clinic_id: 1, hba1c_value: 1 });

export const Test = mongoose.model('Test', testSchema);
export default Test;
