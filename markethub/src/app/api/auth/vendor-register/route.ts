import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import { vendorRegisterSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = vendorRegisterSchema.parse(body);

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if store name is taken
    const existingStore = await Vendor.findOne({
      storeSlug: validatedData.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    });
    if (existingStore) {
      return NextResponse.json(
        { success: false, error: 'Store name already taken' },
        { status: 400 }
      );
    }

    // Create user with vendor role
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      phone: validatedData.phone,
      role: 'vendor',
    });

    // Create vendor profile
    const commissionRate = parseInt(process.env.DEFAULT_COMMISSION_RATE || '10');
    const vendor = await Vendor.create({
      user: user._id,
      storeName: validatedData.storeName,
      description: validatedData.description,
      commissionRate,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        vendor: {
          id: vendor._id,
          storeName: vendor.storeName,
          status: vendor.status,
        },
      },
      message: 'Vendor registration successful. Your account is pending approval.',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Vendor registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
