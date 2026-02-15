import mongoose, { Schema, model, models } from 'mongoose';

// Username: 3–30 chars, alphanumeric + underscore + hyphen. Stored lowercase.
export const USERNAME_MIN_LEN = 3;
export const USERNAME_MAX_LEN = 30;
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    index: true,
    lowercase: true,
    trim: true,
    minlength: USERNAME_MIN_LEN,
    maxlength: USERNAME_MAX_LEN,
  },
  authSalt: { 
    type: String, 
    required: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  activeSessionId: {
    type: String,
    default: null
  },
  lastActiveAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
