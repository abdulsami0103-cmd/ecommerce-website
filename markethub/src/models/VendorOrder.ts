import mongoose, { Schema, Model } from 'mongoose';
import { IVendorOrder } from '@/types';

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
});

const VendorOrderSchema = new Schema<IVendorOrder>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    vendorEarnings: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

VendorOrderSchema.index({ vendor: 1, createdAt: -1 });
VendorOrderSchema.index({ order: 1 });
VendorOrderSchema.index({ status: 1 });

const VendorOrder: Model<IVendorOrder> =
  mongoose.models.VendorOrder || mongoose.model<IVendorOrder>('VendorOrder', VendorOrderSchema);

export default VendorOrder;
