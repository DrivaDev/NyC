import { Schema, model, models } from 'mongoose'

const RestaurantSchema = new Schema(
  {
    clerkId:       { type: String, required: true, unique: true, index: true },
    name:          { type: String, required: true },
    slug:          { type: String, required: true, unique: true, index: true, lowercase: true },
    slugConfirmed: { type: Boolean, default: false },
    logoUrl:       { type: String, default: '' },
    logoPublicId:  { type: String, default: '' },
    description:   { type: String, default: '' },   // Phase 3 — public menu header
    // ── Subscription ────────────────────────────────────────────────────────
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'cancelled'],
      default: 'trial',
    },
    trialEndsAt: {
      type: Date,
      // 14-day free trial starting from account creation
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    subscriptionId:        { type: String, default: '' },   // MP preapproval ID
    subscriptionPeriodEnd: { type: Date,   default: null }, // end of current paid period

    menuColor:      { type: String, default: '#EA580C' }, // accent / active tab
    menuBgColor:    { type: String, default: '#FFF7ED' }, // page background
    menuTitleColor: { type: String, default: '#9A3412' }, // headings & prices
    menuTextColor:  { type: String, default: '#1C1917' }, // body text
  },
  { timestamps: true }
)

// Model registration guard — prevents OverwriteModelError on Next.js hot reload
export const Restaurant = models.Restaurant || model('Restaurant', RestaurantSchema)
