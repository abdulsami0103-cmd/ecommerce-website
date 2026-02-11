'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorRegisterSchema, type VendorRegisterInput } from '@/lib/validations/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Store, CheckCircle } from 'lucide-react';

export default function VendorRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorRegisterInput>({
    resolver: zodResolver(vendorRegisterSchema),
  });

  const onSubmit = async (data: VendorRegisterInput) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/vendor-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Registration failed');
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your vendor account has been created and is pending approval. We'll review your application and notify you via email.
        </p>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <Store className="h-12 w-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Become a Seller</h2>
        <p className="text-gray-600 mt-1">Start selling your products on MarketHub</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="name"
            type="text"
            label="Your name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="phone"
            type="tel"
            label="Phone number"
            placeholder="+971 50 123 4567"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Input
          id="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="storeName"
          type="text"
          label="Store name"
          placeholder="Your Store Name"
          error={errors.storeName?.message}
          {...register('storeName')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store description</label>
          <textarea
            rows={3}
            placeholder="Tell customers about your store and products..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Create password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm password"
            placeholder="Confirm password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Seller Benefits</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Low commission rates starting at 10%</li>
            <li>• Easy-to-use vendor dashboard</li>
            <li>• Secure and fast payments</li>
            <li>• Reach thousands of customers</li>
          </ul>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            required
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <Link href="/seller-guidelines" className="text-blue-600 hover:underline">
              Seller Guidelines
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
          </span>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Submit Application
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
