import mongoose, { Schema, Model } from 'mongoose';
import { IVendor } from '@/types';

const VendorSchema = new Schema<IVendor>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    storeSlug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    logo: { type: String },
    banner: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    totalEarnings: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolder: { type: String },
      iban: { type: String },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Create slug from store name
VendorSchema.pre('validate', function (next) {
  if (this.isModified('storeName') && !this.storeSlug) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for searching
VendorSchema.index({ storeName: 'text', description: 'text' });
VendorSchema.index({ status: 1 });
VendorSchema.index({ storeSlug: 1 });

const Vendor: Model<IVendor> = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;
