import { getMe, loginService } from "@/services/auth-service";
import { AuthData, AuthUser, LoginPayload } from "@/types/auth-types";
import { redirect } from "next/navigation";
import { create } from "zustand";

interface AuthState {
  isLoading: boolean;
  authData: AuthData | null;
  isAuthenticated: boolean;
  error: string | null;
  me: AuthUser | null;
  clearUserDetails: () => void;
  setIsAuthenticated: (auth: boolean) => void;
  initializeAuth: () => void;

  userLogin: (payload: LoginPayload) => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  authData: null,
  isAuthenticated: false,
  error: null,
  me: null,

  initializeAuth: () => {
    const token = localStorage.getItem("accessToken");
    if (token){
        set({ isAuthenticated: true });
    } else {
      set({ isAuthenticated: false, isLoading: false });
      redirect("/"); // Redirect to home if not authenticated
    }
  },

  clearUserDetails: () => {
    set({
      authData: null,
      me: null,
      isAuthenticated: false,
      error: null,
    });
    localStorage.removeItem("accessToken");
    redirect("/login"); // Redirect to landing page on clear
  },

  setIsAuthenticated: (auth: boolean) => set({ isAuthenticated: auth }),

  userLogin: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginService(payload);

      if (!response.success) {
        set({ error: response.message || "Login failed" });
        return;
      }

      set({ authData: response.data, isAuthenticated: true });
      localStorage.setItem("accessToken", response.data.access_token);
      redirect("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
      set({ error: "Login failed. Please check your credentials." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMe();
      if (response.success) {
        set({ me: response.data as AuthUser, isAuthenticated: true });
      } else {
        get().clearUserDetails();
        set({ error: response.message || "Failed to fetch user details" });
      }
    } catch (error) {
      console.error("Failed to fetch user details", error);
      get().clearUserDetails();
      set({ error: "An error occurred while fetching user details" });
    } finally {
      set({ isLoading: false });
    }
  }
}));
