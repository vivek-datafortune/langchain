import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone_number: {
      type: String,
      trim: true,
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
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    is_test_account: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    unique_id: {
      type: String,
      trim: true,
    },
    clinic_id: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const Clinic = mongoose.model('Clinic', clinicSchema);
export default Clinic;
