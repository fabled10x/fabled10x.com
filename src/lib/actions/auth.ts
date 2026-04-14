'use server';

import { signIn, signOut } from '@/auth';

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export type SignInState =
  | { status: 'idle' }
  | { status: 'error'; message: string };

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get('email');
  const callbackUrl = formData.get('callbackUrl');
  if (typeof email !== 'string' || !email.includes('@')) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }
  try {
    await signIn('resend', {
      email,
      redirectTo:
        typeof callbackUrl === 'string' ? callbackUrl : '/products/account',
    });
    return { status: 'idle' };
  } catch {
    return {
      status: 'error',
      message: 'Something went wrong sending the link. Try again in a moment.',
    };
  }
}
