import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import Category from '@/models/Category';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .populate('subcategories')
      .sort({ name: 1 })
      .lean();

    // Build tree structure
    const rootCategories = categories.filter((cat) => !cat.parent);

    return NextResponse.json({
      success: true,
      data: rootCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    await connectDB();

    const category = await Category.create(body);

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
