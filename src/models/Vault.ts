import mongoose, { Schema, model, models } from 'mongoose';

const VaultSchema = new Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  kdfParams: { 
    type: Object, 
    required: true 
  },
  version: { type: Number, default: 1 }
}, { timestamps: true });

const Vault = models.Vault || model('Vault', VaultSchema);

export default Vault;
