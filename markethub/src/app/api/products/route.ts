import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const vendor = searchParams.get('vendor');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const featured = searchParams.get('featured');

    const query: Record<string, unknown> = { isActive: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by vendor
    if (vendor) {
      query.vendor = vendor;
    }

    // Search by name/description
    if (search) {
      query.$text = { $search: search };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice) (query.price as Record<string, number>).$lte = parseFloat(maxPrice);
    }

    // Featured products
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Only show products from approved vendors
    const approvedVendors = await Vendor.find({ status: 'approved' }).select('_id');
    query.vendor = { $in: approvedVendors.map((v) => v._id) };

    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('vendor', 'storeName storeSlug')
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
