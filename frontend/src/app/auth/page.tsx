"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { selectRole } from "@/lib/auth";

type AuthUser = {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: "BUYER" | "FARMER" | "ADMIN" | "DRIVER";
};

type FarmerProfileForm = {
  farmName: string;
  farmDescription: string;
  registrationNumber: string;
  address: string;
  latitude: string;
  longitude: string;
  contactPhone: string;
  logoUrl: string;
};

const defaultProfileForm: FarmerProfileForm = {
  farmName: "",
  farmDescription: "",
  registrationNumber: "",
  address: "",
  latitude: "",
  longitude: "",
  contactPhone: "",
  logoUrl: "",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFarmerProfileForm, setShowFarmerProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState<FarmerProfileForm>(defaultProfileForm);

  const token = useMemo(() => authUser?.token || "", [authUser]);

  // Hydrate from a previously stored session on first load.
  useEffect(() => {
    if (authUser) return;
    const storedToken = localStorage.getItem("token") || "";
    if (!storedToken) return;

    api
      .get("/auth/me", storedToken)
      .then((user) => {
        const hydrated: AuthUser = { ...user, token: storedToken };
        setAuthUser(hydrated);
        localStorage.setItem("user", JSON.stringify(hydrated));
        localStorage.setItem("userId", hydrated.userId);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once NextAuth completes the Google sign-in, it hands us the backend JWT via
  // the session. Mirror it into localStorage, which is what the rest of the app
  // reads for authenticated API calls.
  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken || !session.user) return;
    if (authUser?.token === session.accessToken) return;

    setAuthError(null);
    setLoading(false);
    const hydrated: AuthUser = { ...session.user, token: session.accessToken };
    setAuthUser(hydrated);
    localStorage.setItem("token", hydrated.token);
    localStorage.setItem("user", JSON.stringify(hydrated));
    localStorage.setItem("userId", hydrated.userId);
  }, [status, session, authUser]);

  useEffect(() => {
    if (status === "unauthenticated") setLoading(false);
  }, [status]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    const result = await signIn("google", { redirect: false, callbackUrl: "/auth" });
    if (result?.error) {
      setAuthError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  const updateUserSession = (nextUser: AuthUser) => {
    setAuthUser(nextUser);
    localStorage.setItem("token", nextUser.token);
    localStorage.setItem("user", JSON.stringify(nextUser));
    localStorage.setItem("userId", nextUser.userId);
  };

  const handleSelectBuyer = async () => {
    if (!authUser) return;
    setLoading(true);
    setAuthError(null);

    try {
      const result = await selectRole("BUYER", token);
      updateUserSession({ ...authUser, token: result.token, role: "BUYER" });
      router.push("/marketplace");
    } catch (error) {
      setAuthError((error as Error).message || "Failed to select customer role");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFarmer = async () => {
    if (!authUser) return;
    setLoading(true);
    setAuthError(null);

    try {
      const result = await selectRole("FARMER", token);
      const nextUser = { ...authUser, token: result.token, role: "FARMER" as const };
      updateUserSession(nextUser);

      try {
        const profile = await api.get("/farmer/profile", result.token);
        setProfileForm({
          farmName: profile.farmName || "",
          farmDescription: profile.farmDescription || "",
          registrationNumber: profile.registrationNumber || "",
          address: profile.address || "",
          latitude: profile.latitude != null ? String(profile.latitude) : "",
          longitude: profile.longitude != null ? String(profile.longitude) : "",
          contactPhone: profile.contactPhone || "",
          logoUrl: profile.logoUrl || "",
        });
      } catch {
        setProfileForm(defaultProfileForm);
      }

      setShowFarmerProfileForm(true);
    } catch (error) {
      setAuthError((error as Error).message || "Failed to select farmer role");
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    setLoading(true);
    setAuthError(null);

    try {
      await api.post(
        "/farmer/profile",
        {
          ...profileForm,
          latitude: profileForm.latitude ? Number(profileForm.latitude) : null,
          longitude: profileForm.longitude ? Number(profileForm.longitude) : null,
        },
        authUser.token,
      );
      router.push("/dashboard/farmer");
    } catch (error) {
      setAuthError((error as Error).message || "Failed to save farm profile");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10";

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-amber-50">
        <Spinner className="size-6 text-green-600" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-amber-50 p-6">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-gray-100 bg-white/90 p-8 shadow-xl shadow-green-900/5 backdrop-blur-sm sm:p-10">
            <div className="flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-green-700 text-2xl">
                🌾
              </div>
            </div>
            <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-gray-900">
              Farmers Marketplace
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
              Sign in to buy from trusted farmers, or register your farm and start selling.
            </p>

            {authError && (
              <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Spinner className="size-4 text-gray-500" /> : <GoogleIcon />}
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            <p className="mt-6 text-center text-xs text-gray-400">
              By continuing, you agree to our terms and privacy policy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showFarmerProfileForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/60 p-6">
        <form
          onSubmit={handleFarmerProfileSubmit}
          className="mx-auto mt-10 max-w-2xl rounded-3xl border border-amber-100 bg-white p-8 shadow-xl shadow-amber-900/5 sm:p-10"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Complete farmer registration
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Farmers must register their farm profile before listings can go live.
          </p>

          {authError && (
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <input
              required
              placeholder="Farm name"
              value={profileForm.farmName}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, farmName: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Registration number"
              value={profileForm.registrationNumber}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Contact phone"
              value={profileForm.contactPhone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Logo URL"
              value={profileForm.logoUrl}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Latitude"
              value={profileForm.latitude}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, latitude: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Longitude"
              value={profileForm.longitude}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, longitude: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Farm address"
              value={profileForm.address}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
              className={`${inputClass} md:col-span-2`}
            />
            <textarea
              placeholder="Farm description"
              value={profileForm.farmDescription}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, farmDescription: e.target.value }))}
              className={`${inputClass} md:col-span-2 resize-none`}
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner className="size-4" />}
            {loading ? "Saving profile..." : "Save and continue to farmer dashboard"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Choose your account mode</h2>
        <p className="mt-2 text-sm text-gray-500">
          Customers search and buy. Farmers advertise products and pay recurring listing fees while listed.
        </p>

        {authError && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            onClick={handleSelectBuyer}
            disabled={loading}
            className="group rounded-2xl border border-gray-200 p-6 text-left transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-lg hover:shadow-green-900/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-green-50 text-lg transition group-hover:bg-green-100">
              🛒
            </div>
            <p className="mt-4 text-base font-semibold text-gray-900">Customer</p>
            <p className="mt-1.5 text-sm text-gray-500">
              Find farmers by product, location, and reviews.
            </p>
          </button>
          <button
            onClick={handleSelectFarmer}
            disabled={loading}
            className="group rounded-2xl border border-gray-200 p-6 text-left transition hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-lg transition group-hover:bg-amber-100">
              🌾
            </div>
            <p className="mt-4 text-base font-semibold text-gray-900">Farmer</p>
            <p className="mt-1.5 text-sm text-gray-500">
              Register your farm, list products, and get recommended to customers.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
