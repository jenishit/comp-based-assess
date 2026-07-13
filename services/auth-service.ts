import {
  AuthResponse,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  RegisterResponse,
} from "@/types/auth-types";
import axios from "@/axios/instance";

export const getMe = async () => {
  const token = localStorage.getItem("accessToken");
  const response = await axios.get<MeResponse>(`/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
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
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`/auth/login`, payload);
  return response.data;
};

export const registerService = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  const response = await axios.post<RegisterResponse>(`/auth/register`, payload);
  return response.data;
};
