// lib/auth.ts
import { api } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const BACKEND_BASE_URL = API_URL.endsWith("/api")
  ? API_URL.slice(0, -4)
  : API_URL;

export const startGoogleLogin = () => {
  if (typeof window === "undefined") return;
  window.location.assign(`${BACKEND_BASE_URL}/oauth2/authorization/google`);
};

export const signOut = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
};

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: "BUYER" | "FARMER" | "ADMIN" | "DRIVER";
}

export const selectRole = async (
  role: string,
  token: string,
): Promise<AuthResponse> => {
  return api.post(`/auth/role/select?role=${role}`, {}, token);
};
