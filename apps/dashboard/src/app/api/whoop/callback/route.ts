// /app/api/whoop/callback/route.ts
import { AuthManager } from '@/lib/integrations/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  try {
    const authManager = new AuthManager();
    await authManager.exchangeCodeForToken('WHOOP', code, state);
    return NextResponse.redirect(`${origin}/health`);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
}
