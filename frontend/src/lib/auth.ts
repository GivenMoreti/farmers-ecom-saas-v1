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

export const exchangeGoogleToken = async (idToken: string): Promise<any> => {
  return api.post("/auth/google", { idToken });
};

export const selectRole = async (
  userId: string,
  role: string,
): Promise<any> => {
  return api.post(`/auth/role/select?userId=${userId}&role=${role}`, {});
};
