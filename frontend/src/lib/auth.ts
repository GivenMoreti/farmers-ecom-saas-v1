// lib/auth.ts
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { api } from "./api";

export const signInWithGoogle = async (): Promise<{
  user: User;
  idToken: string;
}> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signOut = async () => {
  await firebaseSignOut(auth);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: "BUYER" | "FARMER" | "ADMIN" | "DRIVER";
}

export const exchangeGoogleToken = async (idToken: string): Promise<AuthResponse> => {
  return api.post("/auth/google", { idToken });
};

export const selectRole = async (
  role: string,
  token: string,
): Promise<AuthResponse> => {
  return api.post(`/auth/role/select?role=${role}`, {}, token);
};
