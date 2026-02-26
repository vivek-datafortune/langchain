import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\d{10}$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other'],
    },
    dob: {
      type: Date,
      required: true,
    },
    user_type: {
      type: String,
      required: true,
      enum: ['patient', 'staff'],
    },
    email: {
      type: String,
      trim: true,
    },
    clinic_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    state_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ clinic_id: 1, user_type: 1 });
userSchema.index({ clinic_id: 1, name: 1 });

export const User = mongoose.model('User', userSchema);
export default User;
