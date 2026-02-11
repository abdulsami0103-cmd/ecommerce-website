import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import Product from '@/models/Product';
import Review from '@/models/Review';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Try to find by slug first, then by ID
    let product = await Product.findOne({ slug: id, isActive: true })
      .populate('vendor', 'storeName storeSlug logo rating totalReviews')
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      product = await Product.findOne({ _id: id, isActive: true })
        .populate('vendor', 'storeName storeSlug logo rating totalReviews')
        .populate('category', 'name slug')
        .lean();
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get reviews for this product
    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get related products from same category
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .populate('vendor', 'storeName')
      .limit(4)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        product,
        reviews,
        relatedProducts,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
