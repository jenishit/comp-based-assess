"use client"
import { refreshAuthToken } from '@/axios/instance';
import { getMe } from '@/services/auth-service';
import { useUserStore } from '@/stores/userStore';
import { useSession } from 'next-auth/react';
import React, { useEffect } from 'react'

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({children}:AuthProviderProps) {
  const {data: session, status} = useSession()
  const { setUser, setLoading, clear } = useUserStore();

  useEffect(() => {
    // Wait for the session to resolve before deciding anything.
    if (status === "loading") return;

    // The session just settled or changed — drop the axios token cache so the
    // next request re-reads it (covers SPA sign-in/-out without a full reload).
    refreshAuthToken();

    // `status` can be "authenticated" while the session still carries no
    // accessToken (a stale cookie, or a token that expired but the session
    // hasn't been cleared yet). Without a token there's nothing to fetch.
    const token = session?.accessToken;
    if (status === "unauthenticated" || !token) {
      clear();
      return;
    }

    let cancelled = false;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await getMe();

        if (cancelled) return;
        if (response.success) {
          setUser(response.data);
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
  }, [status, session?.accessToken, setUser, setLoading, clear]);

  return <>{children}</>;
}
