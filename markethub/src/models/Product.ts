import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '@/types';

const ProductSchema = new Schema<IProduct>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    cost: { type: Number, min: 0 },
    sku: { type: String, sparse: true },
    type: { type: String, enum: ['physical', 'digital'], default: 'physical' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }],
    downloadUrl: { type: String },
    stock: { type: Number, default: 0, min: 0 },
    trackStock: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    attributes: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Create slug from name
ProductSchema.pre('validate', function (next) {
  if (this.isModified('name') && !this.slug) {
    const timestamp = Date.now().toString(36);
    this.slug = `${this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${timestamp}`;
  }
  next();
});

// Indexes for searching and filtering
ProductSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
ProductSchema.index({ vendor: 1, isActive: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ totalSales: -1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
