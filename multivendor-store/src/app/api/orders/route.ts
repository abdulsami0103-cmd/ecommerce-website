import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import Order from '@/models/Order';
import VendorOrder from '@/models/VendorOrder';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: session.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: session.user.id }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { shippingAddress, paymentMethod, notes } = await request.json();

    await connectDB();

    // Get user's cart
    const cart = await Cart.findOne({ user: session.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate stock and prepare order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product).populate('vendor');
      if (!product || !product.isActive) {
        return NextResponse.json(
          { success: false, error: `Product ${item.product} is no longer available` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      orderItems.push({
        product: product._id,
        vendor: product.vendor._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0],
      });

      subtotal += product.price * item.quantity;
    }

    const shippingCost = subtotal > 200 ? 0 : 15; // Free shipping over 200
    const tax = subtotal * 0.05; // 5% VAT
    const total = subtotal + shippingCost + tax;

    // Create main order
    const order = await Order.create({
      user: session.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      tax,
      total,
      paymentMethod,
      notes,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    });

    // Create vendor-specific orders
    const vendorGroups = orderItems.reduce((groups, item) => {
      const vendorId = item.vendor.toString();
      if (!groups[vendorId]) {
        groups[vendorId] = [];
      }
      groups[vendorId].push(item);
      return groups;
    }, {} as Record<string, typeof orderItems>);

    for (const [vendorId, items] of Object.entries(vendorGroups)) {
      const vendor = await Vendor.findById(vendorId);
      const vendorSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const commission = vendorSubtotal * (vendor?.commissionRate || 10) / 100;
      const vendorEarnings = vendorSubtotal - commission;

      await VendorOrder.create({
        order: order._id,
        vendor: vendorId,
        items,
        subtotal: vendorSubtotal,
        commission,
        vendorEarnings,
        status: 'pending',
      });
    }

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, totalSales: item.quantity },
      });
    }

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order placed successfully',
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
