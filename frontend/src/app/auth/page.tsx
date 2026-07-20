"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { exchangeGoogleToken, selectRole, signInWithGoogle } from "@/lib/auth";

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

export default function AuthPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFarmerProfileForm, setShowFarmerProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState<FarmerProfileForm>(defaultProfileForm);

  const token = useMemo(() => authUser?.token || "", [authUser]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    if (!storedToken) return;

    api.get("/auth/me", storedToken)
      .then((user) => {
        const hydrated: AuthUser = {
          ...user,
          token: storedToken,
        };
        setAuthUser(hydrated);
        localStorage.setItem("user", JSON.stringify(hydrated));
        localStorage.setItem("userId", hydrated.userId);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
      });
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const { idToken } = await signInWithGoogle();
      const result = await exchangeGoogleToken(idToken);

      const nextUser: AuthUser = {
        token: result.token,
        userId: result.userId,
        email: result.email,
        displayName: result.displayName,
        role: result.role,
      };

      localStorage.setItem("token", nextUser.token);
      localStorage.setItem("user", JSON.stringify(nextUser));
      localStorage.setItem("userId", nextUser.userId);
      setAuthUser(nextUser);
    } catch (error) {
      setAuthError((error as Error).message || "Failed to sign in");
    } finally {
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

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 p-6">
        <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-green-100 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">Farmers Marketplace</h1>
          <p className="mt-3 text-gray-600">
            Sign in to buy from trusted farmers or register your farm and start selling.
          </p>
          {authError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>
          )}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </div>
    );
  }

  if (showFarmerProfileForm) {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <form
          onSubmit={handleFarmerProfileSubmit}
          className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900">Complete Farmer Registration</h2>
          <p className="mt-2 text-gray-600">
            Farmers must register their farm profile before listings can go live.
          </p>

          {authError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              required
              placeholder="Farm name"
              value={profileForm.farmName}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, farmName: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Registration number"
              value={profileForm.registrationNumber}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Contact phone"
              value={profileForm.contactPhone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Logo URL"
              value={profileForm.logoUrl}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Latitude"
              value={profileForm.latitude}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, latitude: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Longitude"
              value={profileForm.longitude}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, longitude: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Farm address"
              value={profileForm.address}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
            />
            <textarea
              placeholder="Farm description"
              value={profileForm.farmDescription}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, farmDescription: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? "Saving profile..." : "Save and Continue to Farmer Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto mt-20 max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900">Choose your account mode</h2>
        <p className="mt-2 text-gray-600">
          Customers search and buy. Farmers advertise products and pay recurring listing fees while listed.
        </p>

        {authError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            onClick={handleSelectBuyer}
            disabled={loading}
            className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-green-500 hover:shadow disabled:opacity-60"
          >
            <p className="text-lg font-semibold text-gray-900">Customer</p>
            <p className="mt-2 text-sm text-gray-600">
              Find farmers by product, location, and reviews.
            </p>
          </button>
          <button
            onClick={handleSelectFarmer}
            disabled={loading}
            className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-amber-500 hover:shadow disabled:opacity-60"
          >
            <p className="text-lg font-semibold text-gray-900">Farmer</p>
            <p className="mt-2 text-sm text-gray-600">
              Register your farm, list products, and get recommended to customers.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
