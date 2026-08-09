"use client"
import { getMe } from '@/services/auth-service';
import { useUserStore } from '@/stores/user-store';
import { signOut, useSession } from 'next-auth/react';
import React, { useEffect } from 'react'

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()
  const { setUser, setLoading, clear } = useUserStore();

  useEffect(() => {
    // If token refresh failed irrecoverably, sign out
    if (session?.error === 'RefreshAccessTokenError') {
      console.error('[auth] signing out: session carries RefreshAccessTokenError');
      signOut({ callbackUrl: '/login' });
      return;
    }

    // Wait for the session to resolve before deciding anything.
    if (status === "loading") return;

    // Backend tokens never reach the client anymore — the /api/backend proxy
    // injects them server-side — so an authenticated status is all we need.
    if (status === "unauthenticated") {
      clear();
      return;
    }

    let cancelled = false;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const user = await getMe();

        if (cancelled) return;
        if (user?.id) {
          setUser(user);
        } else {
          clear();
        }
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [status, session, setUser, setLoading, clear]);

  return <>{children}</>;
}
