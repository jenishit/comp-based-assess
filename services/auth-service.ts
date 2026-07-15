import {
  LoginPayload,
  LoginResponse,
  MeResponse,
  RegisterPayload,
  RegisterResponse,
} from "@/types/auth-types";
import axios from "@/axios/instance";

export const getMe = async (): Promise<MeResponse> => {
  const response = await fetch(`/api/user/me`)
  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
};

export const changePasswordService = async (
  new_password: string,
): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await axios.put<{
    success: boolean;
    message: string;
  }>(`/users/change-password`, { new_password });

  return response.data;
};

export const loginService = async (
  payload: LoginPayload,
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`/auth/login`, payload);
  return response.data;
};

export const registerService = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  const response = await axios.post<RegisterResponse>(`/auth/register`, payload);
  return response.data;
};
