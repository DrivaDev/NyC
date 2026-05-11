import { Schema, model, models } from 'mongoose'

const PromoCodeSchema = new Schema(
  {
    code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    freeMonths:  { type: Number, required: true, min: 1, default: 1 },
    maxUses:     { type: Number, default: 0 },   // 0 = unlimited
    usedCount:   { type: Number, default: 0 },
    expiresAt:   { type: Date,   default: null },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const PromoCode = models.PromoCode || model('PromoCode', PromoCodeSchema)
