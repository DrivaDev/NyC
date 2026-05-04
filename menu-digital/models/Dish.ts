import { Schema, model, models } from 'mongoose'

const DishSchema = new Schema(
  {
    restaurantId:  { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    categoryId:    { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    name:          { type: String, required: true },
    description:   { type: String, default: '' },
    price:         { type: Number, required: true },  // stored as cents (integer)
    available:     { type: Boolean, default: true },
    imageUrl:      { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    allergens:     { type: [String], default: [] },
  },
  { timestamps: true }
)

export const Dish = models.Dish || model('Dish', DishSchema)
