export interface AuthData {
  access_token?: string;
        refresh_token?: string;
        session_id?: string;
        user_id?: string;
        role_id?: string;
        role?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export type RegisterResponse = LoginResponse;

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}
