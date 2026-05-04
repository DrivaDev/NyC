import { Schema, model, models } from 'mongoose'

const CategorySchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name:         { type: String, required: true },
    order:        { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Category = models.Category || model('Category', CategorySchema)
