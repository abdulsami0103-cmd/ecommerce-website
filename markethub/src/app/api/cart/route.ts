import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const cart = await Cart.findOne({ user: session.user.id })
      .populate({
        path: 'items.product',
        select: 'name slug price images stock vendor',
        populate: { path: 'vendor', select: 'storeName' },
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: cart || { items: [] },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
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

    const { productId, quantity = 1 } = await request.json();

    await connectDB();

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ user: session.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: session.user.id,
        items: [{ product: productId, quantity, price: product.price }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
        existingItem.price = product.price;
      } else {
        cart.items.push({ product: productId, quantity, price: product.price });
      }

      await cart.save();
    }

    return NextResponse.json({
      success: true,
      data: cart,
      message: 'Item added to cart',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId } = await request.json();

    await connectDB();

    const cart = await Cart.findOne({ user: session.user.id });
    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    return NextResponse.json({
      success: true,
      data: cart,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
