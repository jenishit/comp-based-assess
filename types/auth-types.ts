import { BaseResponse } from "./base-types";

export interface loginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    session_id: string;
    user_id: string;
    user_type: string;
  };
}

export interface AuthUser {
    id: string;
    phone: string;
    email: string;
    full_name: string;
    role?: string;
}

export interface AuthData {
  access_token: string;
  session_id: string;
  user_id: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse extends BaseResponse {
  data: AuthData
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
}

export interface MeResponse extends BaseResponse {
  data: AuthUser
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}
