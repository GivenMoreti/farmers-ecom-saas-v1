"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type AuthUser = {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: "BUYER" | "FARMER" | "ADMIN" | "DRIVER";
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token") || "";

    if (!token) {
      setError("Missing authentication token from Google login.");
      return;
    }

    api.get("/auth/me", token)
      .then((user) => {
        const authUser: AuthUser = {
          ...user,
          token,
        };

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(authUser));
        localStorage.setItem("userId", authUser.userId);
        router.replace("/auth");
      })
      .catch(() => {
        setError("Google login could not be completed. Please try again.");
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-amber-50 p-6">
      <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-green-100 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Completing sign-in</h1>
        {!error && <p className="mt-3 text-gray-600">Finishing Google authentication...</p>}
        {error && (
          <>
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.replace("/auth")}
              className="mt-6 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
