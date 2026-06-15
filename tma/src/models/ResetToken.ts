import mongoose, { Schema, Document } from "mongoose"

export interface IResetToken extends Document {
  email: string
  token: string
  expiresAt: Date
}

const ResetTokenSchema = new Schema<IResetToken>({
  email: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
})

export default mongoose.models.ResetToken || mongoose.model<IResetToken>("ResetToken", ResetTokenSchema)
