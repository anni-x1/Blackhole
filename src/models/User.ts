import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  authSalt: { 
    type: String, 
    required: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
