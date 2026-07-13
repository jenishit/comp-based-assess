import { AuthUser } from "@/types/auth-types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface UserState {
  user: AuthUser | null;
  loading: boolean;

  setUser: (user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;

  isAuthenticated: () => boolean;
  getUserId: () => string | undefined;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      user: null,
      loading: false,

      setUser: (user) => set({ user }, false, "setUser"),

      updateUser: (updates) =>
        set(
          (state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }),
          false,
          "updateUser",
        ),
      setLoading: (loading) => set({ loading }, false, "setLoading"),

      clear: () => set({ user: null, loading: false }, false, "clear"),

      //Selectors
      isAuthenticated: () => get().user !== null,

      getUserId: () => get().user?.id,
    }),
    { name: "UserStore" },
  ),
);
