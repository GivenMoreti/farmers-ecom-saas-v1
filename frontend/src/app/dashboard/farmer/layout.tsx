"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Truck,
  Car,
  Store,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { FarmerAuthProvider, type FarmerUser } from "./FarmerAuthContext";

const NAV_ITEMS = [
  { href: "/dashboard/farmer", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/farmer/orders", label: "Orders", icon: Package },
  { href: "/dashboard/farmer/deliveries", label: "Deliveries", icon: Truck },
  { href: "/dashboard/farmer/vehicles", label: "Vehicles", icon: Car },
];

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="size-[18px]" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileFooter({
  initials,
  displayName,
  email,
  onSignOut,
}: {
  initials: string;
  displayName: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
        <p className="truncate text-xs text-gray-400">{email}</p>
      </div>
      <button
        onClick={onSignOut}
        title="Sign out"
        className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export default function FarmerDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<FarmerUser | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const verify = useCallback(async () => {
    const storedToken = localStorage.getItem("token") || "";
    if (!storedToken) {
      router.replace("/auth");
      return;
    }

    try {
      const userData = await api.get("/auth/me", storedToken);
      if (userData.role !== "FARMER") {
        router.replace("/marketplace");
        return;
      }
      setUser(userData);
      setToken(storedToken);
    } catch (error) {
      console.error("Failed to verify farmer session:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      router.replace("/auth");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    verify();
  }, [verify]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = initialsOf(user.displayName || user.email);
  const displayName = user.displayName || user.email;

  return (
    <FarmerAuthProvider value={{ user, token }}>
      <div className="min-h-screen bg-slate-50 md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-green-50 text-lg">
              🌾
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Farm Dashboard</p>
              <p className="text-xs text-gray-400">Manage your farm</p>
            </div>
          </div>

          <NavLinks pathname={pathname} />

          <div className="space-y-1 border-t border-gray-100 p-3">
            <Link
              href="/marketplace"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <Store className="size-[18px]" strokeWidth={2} />
              View marketplace
            </Link>
            <ProfileFooter
              initials={initials}
              displayName={displayName}
              email={user.email}
              onSignOut={handleSignOut}
            />
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 text-base">
              🌾
            </div>
            <p className="text-sm font-semibold text-gray-900">Farm Dashboard</p>
          </div>
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <Menu className="size-5" />
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between px-5 py-5">
                <p className="text-sm font-semibold text-gray-900">Farm Dashboard</p>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavLinks pathname={pathname} />
              <div className="border-t border-gray-100 p-3">
                <ProfileFooter
                  initials={initials}
                  displayName={displayName}
                  email={user.email}
                  onSignOut={handleSignOut}
                />
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </FarmerAuthProvider>
  );
}
