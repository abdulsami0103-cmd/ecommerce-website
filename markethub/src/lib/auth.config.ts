import type { NextAuthConfig } from 'next-auth';

// Define UserRole here to avoid importing from @/types which includes mongoose
type UserRole = 'customer' | 'vendor' | 'admin';

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    vendorId?: string;
    vendorStatus?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      vendorId?: string;
      vendorStatus?: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    vendorId?: string;
    vendorStatus?: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [], // Providers configured in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.vendorId = user.vendorId;
        token.vendorStatus = user.vendorStatus;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.vendorId = token.vendorId;
      session.user.vendorStatus = token.vendorStatus;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const userRole = auth?.user?.role;
      const vendorStatus = auth?.user?.vendorStatus;

      // API routes - always allow
      if (pathname.startsWith('/api')) {
        return true;
      }

      // Auth routes - redirect if already logged in
      const authRoutes = ['/login', '/register'];
      if (authRoutes.includes(pathname) && isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Protected customer routes
      const customerRoutes = ['/cart', '/checkout', '/orders', '/wishlist', '/account'];
      if (customerRoutes.some((route) => pathname.startsWith(route))) {
        if (!isLoggedIn) {
          return Response.redirect(new URL('/login', nextUrl));
        }
      }

      // Vendor dashboard routes
      if (pathname.startsWith('/dashboard/vendor')) {
        if (!isLoggedIn) {
          return Response.redirect(new URL('/login', nextUrl));
        }
        if (userRole !== 'vendor') {
          return Response.redirect(new URL('/', nextUrl));
        }
        if (vendorStatus !== 'approved') {
          return Response.redirect(new URL('/vendor/pending', nextUrl));
        }
      }

      // Admin dashboard routes
      if (pathname.startsWith('/dashboard/admin')) {
        if (!isLoggedIn) {
          return Response.redirect(new URL('/login', nextUrl));
        }
        if (userRole !== 'admin') {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
