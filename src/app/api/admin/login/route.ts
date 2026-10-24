import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findAdminByEmail, verifyAdminRole } from '@/lib/db';
import { comparePassword, createAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email and password' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Direct Master Admin Authentication
    // Guarantees store owners and primary admins are never locked out by network/auth issues
    const isMasterAdmin =
      (cleanEmail === 'admin@dhagadiaries.com' && (password === 'DhagaAdmin@2026!' || password === 'admin123')) ||
      (cleanEmail === 'owner@dhagadiaries.com' && (password === 'DhagaOwner@2026!' || password === 'dhaga-demo'));

    if (isMasterAdmin) {
      const adminUser = {
        id: cleanEmail === 'admin@dhagadiaries.com' ? 'admin_1' : 'admin_2',
        email: cleanEmail,
        name: cleanEmail === 'admin@dhagadiaries.com' ? 'Dhaga Administrator' : 'Store Owner',
        role: (cleanEmail === 'admin@dhagadiaries.com' ? 'admin' : 'owner') as 'admin' | 'owner',
      };

      // Background sync admin role to Supabase if available
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseServerClient();
          if (supabase) {
            await supabase.from('admin_roles').upsert(
              {
                email: cleanEmail,
                name: adminUser.name,
                role: adminUser.role,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'email' }
            );
          }
        } catch (syncErr) {
          console.warn('Background admin_roles upsert skipped:', syncErr);
        }
      }

      const token = createAdminToken(adminUser);
      const response = NextResponse.json({
        success: true,
        user: adminUser,
        mode: isSupabaseConfigured() ? 'supabase_master' : 'local_master',
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 2. Try Supabase Auth if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!authError && authData?.user) {
            // Check if this Supabase user has an admin role in admin_roles table
            const isAdmin = await verifyAdminRole(authData.user.id, authData.user.email || cleanEmail);
            if (!isAdmin) {
              return NextResponse.json(
                {
                  error:
                    'Access Denied: Your account does not have administrator privileges. Please contact the store owner or run create_first_admin() in Supabase.',
                },
                { status: 403 }
              );
            }

            const adminProfile = await findAdminByEmail(cleanEmail);
            const adminUser = {
              id: authData.user.id,
              email: authData.user.email || cleanEmail,
              name: adminProfile?.name || authData.user.user_metadata?.full_name || 'Dhaga Administrator',
              role: (adminProfile?.role || 'admin') as 'admin' | 'owner' | 'manager',
            };

            const token = createAdminToken(adminUser);
            const response = NextResponse.json({
              success: true,
              user: adminUser,
              mode: 'supabase',
              session: authData.session,
            });

            response.cookies.set({
              name: ADMIN_COOKIE_NAME,
              value: token,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24 * 7,
            });

            return response;
          }
        }
      } catch (supaErr) {
        console.warn('Supabase Auth error during login, falling back to local:', supaErr);
      }
    }

    // 3. Fallback to local admin user verification from database
    try {
      const user = await findAdminByEmail(cleanEmail);
      if (user && user.passwordHash) {
        const isMatch = comparePassword(password, user.passwordHash);
        if (isMatch) {
          const adminUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };

          const token = createAdminToken(adminUser);
          const response = NextResponse.json({
            success: true,
            user: adminUser,
            mode: 'local_fallback',
          });

          response.cookies.set({
            name: ADMIN_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          });

          return response;
        }
      }
    } catch (fallbackErr) {
      console.warn('Local admin fallback check failed:', fallbackErr);
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
