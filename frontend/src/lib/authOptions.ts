import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    // Runs after Google redirects back with tokens. Hands the Google ID token
    // to the backend, which verifies it independently and mints its own JWT —
    // that JWT (not this NextAuth session) is what authorizes API calls.
    async signIn({ user, account }) {
      try {
        const response = await fetch(`${API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account?.id_token }),
        });

        if (!response.ok) return false;

        const authData = await response.json();
        if (authData?.token) {
          user.accessToken = authData.token;
          user.backendUser = {
            userId: authData.userId,
            email: authData.email,
            displayName: authData.displayName,
            role: authData.role,
          };
          return true;
        }
        return false;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    // Persists accessToken/backendUser into the encrypted JWT session token.
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.backendUser = user.backendUser;
      }
      return token;
    },
    // Exposes them on the client-facing `session` object.
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user = token.backendUser;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days, matches backend JWT expiry
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  debug: process.env.NODE_ENV === "development",
};
