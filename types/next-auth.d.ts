// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string
    session_id?: string;
    user_id?: string;
    role_id?: string;
    role?: string;
    roles?: string[];
    instructor_profile_id?: string;
    error?: string;
    name?: string;
    token_type?: string;
  }

  interface User extends DefaultUser {
    accessToken?: string;
    refreshToken?: string;
    session_id?: string;
    role_id?: string;
    instructor_profile_id?: string;
    role?: string;
    roles?: string[];
    user_id?: string;
    name?: string;
    token_type?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string
    role_id?: string;
    instructor_profile_id?: string;
    role?: string;
    roles?: string[];
    user_id?: string;
    session_id?: string;
    error?: string;
    name?: string;
    token_type?: string;
  }
}