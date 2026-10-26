import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findAdminByEmail, verifyAdminRole } from '@/lib/db';
import { comparePassword, createAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

const loginSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter your mobile number and password' }, { status: 400 });
    }

    const { email, phone, password } = parsed.data;
    const identifier = (phone || email || '').trim();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');
    const cleanEmail = identifier.toLowerCase();

    // 1. Direct Master Admin Authentication via Mobile Number or Email
    // Primary: 9137407394 (supports +91, 0, or plain 10 digits)
    const isPhoneMatch =
      cleanDigits === '9137407394' ||
      cleanDigits === '919137407394' ||
      cleanDigits === '09137407394' ||
      cleanDigits.endsWith('9137407394');

    const isEmailMatch =
      cleanEmail === 'admin@dhagadiaries.com' ||
      cleanEmail === 'owner@dhagadiaries.com' ||
      cleanEmail === '9137407394';

    const isPasswordMatch =
      password === 'DhagaAdmin@2026!' ||
      password === 'admin123' ||
      password === '9137407394' ||
      password === 'DhagaAdmin' ||
      password === 'DhagaOwner@2026!' ||
      password === 'dhaga-demo';

    const isMasterAdmin = (isPhoneMatch || isEmailMatch) && isPasswordMatch;

    if (isMasterAdmin) {
      const adminUser = {
        id: 'admin_1',
        email: '9137407394',
        name: 'Dhaga Administrator',
        role: 'admin' as const,
      };

      // Background sync admin role to Supabase if available
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseServerClient();
          if (supabase) {
            await supabase.from('admin_roles').upsert(
              {
                email: '9137407394',
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
        mode: 'phone_master',
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
            const isAdmin = await verifyAdminRole(authData.user.id, authData.user.email || cleanEmail);
            if (!isAdmin) {
              return NextResponse.json(
                { error: 'Access Denied: Account does not have administrator privileges.' },
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
      const user = await findAdminByEmail(identifier);
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

    return NextResponse.json(
      { error: 'Galat Mobile Number ya Password. Kripya sahi details enter karein.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
