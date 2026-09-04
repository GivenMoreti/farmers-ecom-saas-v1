// lib/auth.ts
import { signOut as nextAuthSignOut } from "next-auth/react";
import { api } from "./api";

export const signOut = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  await nextAuthSignOut({ redirect: false });
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
