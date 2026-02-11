import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const vendorStatus = req.auth?.user?.vendorStatus;

  // Public routes - allow access
  const publicRoutes = ['/', '/products', '/login', '/register', '/vendor/register'];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/products/') || pathname.startsWith('/vendor/')
  );

  // API routes - handle separately
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Auth routes - redirect if already logged in
  const authRoutes = ['/login', '/register'];
  if (authRoutes.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Protected customer routes
  const customerRoutes = ['/cart', '/checkout', '/orders', '/wishlist', '/account'];
  if (customerRoutes.some((route) => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Vendor dashboard routes
  if (pathname.startsWith('/dashboard/vendor')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (userRole !== 'vendor') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (vendorStatus !== 'approved') {
      return NextResponse.redirect(new URL('/vendor/pending', req.url));
    }
  }

  // Admin dashboard routes
  if (pathname.startsWith('/dashboard/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
