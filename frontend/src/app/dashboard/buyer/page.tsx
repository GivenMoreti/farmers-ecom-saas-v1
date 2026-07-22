"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// ─── Types matching backend models ──────────────────────────────────────────

interface CurrentUser {
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

interface OrderProduct {
  id: string;
  name: string;
  breed?: string;
  media?: string[];
}

interface Order {
  id: string;
  status: "CART" | "PENDING" | "PAID" | "PROCESSING" | "READY" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  productPrice: number;
  buyerServiceFee: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryInstructions?: string;
  farmerDeliverySelected: boolean;
  farmerDeliveryFee?: number;
  paidAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  product?: OrderProduct;
}

interface WalletBalance {
  balance: number;
  totalSpent: number;
  autoTopupEnabled: boolean;
  autoTopupThreshold: number;
  autoTopupAmount: number;
}

interface WalletTransaction {
  id: string;
  type: "TOPUP" | "LISTING_FEE" | "BUYER_FEE" | "COMMISSION" | "REFUND" | "WITHDRAWAL";
  amount: number;
  balanceAfter: number;
  description?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  farmName?: string;
  categoryName?: string;
  media?: string[];
  averageRating?: number;
}

interface Favorite {
  id: string;
  product: FavoriteProduct;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  CART:       "bg-gray-100 text-gray-600",
  PENDING:    "bg-yellow-100 text-yellow-700",
  PAID:       "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  READY:      "bg-purple-100 text-purple-700",
  DELIVERED:  "bg-teal-100 text-teal-700",
  COMPLETED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-600",
};

const TX_STYLES: Record<string, string> = {
  TOPUP:       "text-green-600",
  REFUND:      "text-green-600",
  BUYER_FEE:   "text-red-500",
  LISTING_FEE: "text-red-500",
  COMMISSION:  "text-red-500",
  WITHDRAWAL:  "text-red-500",
};

const fmt = (n?: number) =>
  `R${Number(n ?? 0).toFixed(2)}`;

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";

type Tab = "overview" | "orders" | "wallet" | "favorites";

// ─── Component ───────────────────────────────────────────────────────────────

export default function BuyerDashboardPage() {
  const router = useRouter();
  const tokenRef = useRef("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupResult, setTopupResult] = useState<string | null>(null);

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [removingFavId, setRemovingFavId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (authToken: string) => {
    try {
      const [me, buyerOrders, walletBalance, walletTx, favs] = await Promise.all([
        api.get("/auth/me", authToken),
        api.get("/orders/buyer", authToken),
        api.get("/wallet/balance", authToken),
        api.get("/wallet/transactions", authToken),
        api.get("/favorites", authToken),
      ]);

      setUser(me);
      setOrders(buyerOrders ?? []);
      setWallet(walletBalance);
      setTransactions(walletTx ?? []);
      setFavorites(favs ?? []);
    } catch (e) {
      setError((e as Error).message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    if (!storedToken) {
      router.push("/auth");
      return;
    }
    tokenRef.current = storedToken;
    setTimeout(() => loadAll(storedToken), 0);
  }, [router, loadAll]);

  // ── Actions ──

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Cancel this order?")) return;
    setCancellingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: "CANCELLED" }, tokenRef.current);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
    } catch (e) {
      alert((e as Error).message || "Could not cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const removeFavorite = async (productId: string) => {
    setRemovingFavId(productId);
    try {
      await api.delete(`/favorites/${productId}`, tokenRef.current);
      setFavorites((prev) => prev.filter((f) => f.product?.id !== productId));
    } catch (e) {
      alert((e as Error).message || "Could not remove favourite");
    } finally {
      setRemovingFavId(null);
    }
  };

  const initiateTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupError(null);
    setTopupResult(null);
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      setTopupError("Enter a valid amount");
      return;
    }
    setTopupLoading(true);
    try {
      const result = await api.post(`/wallet/topup/initiate?amount=${amount}`, {}, tokenRef.current);
      setTopupResult(result?.paymentUrl || result?.message || "Top-up initiated — follow your payment provider's link.");
    } catch (e) {
      setTopupError((e as Error).message || "Top-up failed");
    } finally {
      setTopupLoading(false);
    }
  };

  // ── Derived stats ──

  const activeOrders  = orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status));
  const totalSpend    = orders.filter((o) => o.status === "COMPLETED")
                              .reduce((s, o) => s + Number(o.totalAmount ?? 0), 0);

  // ── Render guards ──

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <p className="text-gray-500 animate-pulse">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <div className="rounded-xl bg-white p-8 shadow text-center max-w-sm">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={() => router.push("/auth")} className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800">
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  // ─── UI ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {user?.displayName ?? user?.email}</p>
        </div>
        <Link href="/marketplace" className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">
          Browse Marketplace
        </Link>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Tabs */}
        <nav className="mb-8 flex gap-1 rounded-xl bg-white p-1 shadow-sm border">
          {(["overview", "orders", "wallet", "favorites"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                tab === t ? "bg-green-700 text-white shadow" : "text-gray-600 hover:bg-green-50"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Wallet Balance"  value={fmt(wallet?.balance)}  sub="Available to spend"    colour="green" />
            <StatCard label="Active Orders"   value={String(activeOrders.length)} sub="In progress"    colour="blue"  />
            <StatCard label="Total Spent"     value={fmt(totalSpend)}        sub="Completed orders"    colour="amber" />
            <StatCard label="Favourites"      value={String(favorites.length)} sub="Saved products"   colour="rose"  />

            {/* Recent orders preview */}
            <div className="sm:col-span-2 lg:col-span-4 rounded-xl bg-white p-5 shadow-sm border">
              <h2 className="mb-3 font-semibold text-gray-800">Recent Orders</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500">No orders yet. <Link href="/marketplace" className="text-green-700 underline">Shop now →</Link></p>
              ) : (
                <div className="divide-y">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-700 font-medium">{o.product?.name ?? `Order #${o.id.slice(0, 8)}`}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{fmt(o.totalAmount)}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <EmptyState message="You haven't placed any orders yet." cta={{ label: "Browse products", href: "/marketplace" }} />
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-xl bg-white border p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {order.product?.name ?? "Unknown product"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Order ID: {order.id.slice(0, 8).toUpperCase()} · Placed {fmtDate(order.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 sm:grid-cols-4">
                    <Detail label="Product price"   value={fmt(order.productPrice)} />
                    <Detail label="Service fee"     value={fmt(order.buyerServiceFee)} />
                    <Detail label="Total"           value={fmt(order.totalAmount)} bold />
                    <Detail label="Farmer delivery" value={order.farmerDeliverySelected ? fmt(order.farmerDeliveryFee) : "No"} />
                    <Detail label="Delivery address" value={order.deliveryAddress || "—"} span={2} />
                    {order.deliveryInstructions && (
                      <Detail label="Instructions" value={order.deliveryInstructions} span={2} />
                    )}
                    {order.paidAt     && <Detail label="Paid"      value={fmtDate(order.paidAt)} />}
                    {order.deliveredAt && <Detail label="Delivered" value={fmtDate(order.deliveredAt)} />}
                    {order.completedAt && <Detail label="Completed" value={fmtDate(order.completedAt)} />}
                    {order.cancelledAt && <Detail label="Cancelled" value={fmtDate(order.cancelledAt)} />}
                  </div>

                  {["CART", "PENDING"].includes(order.status) && (
                    <div className="mt-4 flex justify-end">
                      <button
                        disabled={cancellingId === order.id}
                        onClick={() => cancelOrder(order.id)}
                        className="rounded-lg border border-red-300 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === order.id ? "Cancelling…" : "Cancel Order"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Wallet ── */}
        {tab === "wallet" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Balance card */}
            <div className="rounded-xl bg-green-700 p-6 text-white shadow-lg">
              <p className="text-sm font-medium opacity-80">Available Balance</p>
              <p className="mt-2 text-4xl font-bold">{fmt(wallet?.balance)}</p>
              <p className="mt-1 text-sm opacity-70">Total spent: {fmt(wallet?.totalSpent)}</p>
            </div>

            {/* Top-up form */}
            <div className="rounded-xl bg-white border p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-800">Top Up Wallet</h2>
              <form onSubmit={initiateTopup} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (ZAR)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="e.g. 500.00"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                {topupError  && <p className="text-xs text-red-600">{topupError}</p>}
                {topupResult && <p className="text-xs text-green-700 break-all">{topupResult}</p>}
                <button
                  type="submit"
                  disabled={topupLoading}
                  className="w-full rounded-lg bg-green-700 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {topupLoading ? "Processing…" : "Initiate Top-Up"}
                </button>
              </form>
            </div>

            {/* Auto top-up info */}
            <div className="rounded-xl bg-white border p-6 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-800">Auto Top-Up</h2>
              <p className="text-sm text-gray-500 mb-3">
                {wallet?.autoTopupEnabled
                  ? `Auto top-up is enabled. Triggers at ${fmt(wallet.autoTopupThreshold)}, adds ${fmt(wallet.autoTopupAmount)}.`
                  : "Auto top-up is currently disabled."}
              </p>
              <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${wallet?.autoTopupEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {wallet?.autoTopupEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {/* Transactions */}
            <div className="lg:col-span-3 rounded-xl bg-white border p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-800">Transaction History</h2>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-500">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2 pr-4">Description</th>
                        <th className="pb-2 pr-4 text-right">Amount</th>
                        <th className="pb-2 pr-4 text-right">Balance After</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-2 pr-4 text-gray-500">{fmtDate(tx.createdAt)}</td>
                          <td className="py-2 pr-4">
                            <span className={`font-medium ${TX_STYLES[tx.type] ?? "text-gray-700"}`}>
                              {tx.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">{tx.description || "—"}</td>
                          <td className={`py-2 pr-4 text-right font-semibold ${TX_STYLES[tx.type] ?? "text-gray-700"}`}>
                            {["TOPUP", "REFUND"].includes(tx.type) ? "+" : "-"}{fmt(tx.amount)}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-600">{fmt(tx.balanceAfter)}</td>
                          <td className="py-2 text-right">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              tx.status === "COMPLETED" ? "bg-green-100 text-green-700"
                              : tx.status === "FAILED"  ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Favorites ── */}
        {tab === "favorites" && (
          <div>
            {favorites.length === 0 ? (
              <EmptyState message="You haven't saved any favourites yet." cta={{ label: "Explore products", href: "/marketplace" }} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((fav) => {
                  const p = fav.product;
                  if (!p) return null;
                  return (
                    <div key={fav.id} className="rounded-xl bg-white border p-5 shadow-sm flex flex-col gap-3">
                      {p.media?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.media[0]} alt={p.name} className="h-36 w-full rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.farmName} · {p.categoryName}</p>
                        <p className="mt-1 font-bold text-green-700">{fmt(p.price)}</p>
                        {p.averageRating != null && (
                          <p className="text-xs text-amber-600 mt-0.5">★ {p.averageRating.toFixed(1)}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/marketplace?query=${encodeURIComponent(p.name)}`}
                          className="flex-1 rounded-lg border border-green-700 px-3 py-1.5 text-center text-sm font-semibold text-green-700 hover:bg-green-50"
                        >
                          View
                        </Link>
                        <button
                          disabled={removingFavId === p.id}
                          onClick={() => removeFavorite(p.id)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {removingFavId === p.id ? "…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colour }: { label: string; value: string; sub: string; colour: string }) {
  const colours: Record<string, string> = {
    green: "border-l-green-500",
    blue:  "border-l-blue-500",
    amber: "border-l-amber-500",
    rose:  "border-l-rose-500",
  };
  return (
    <div className={`rounded-xl bg-white border border-l-4 p-5 shadow-sm ${colours[colour] ?? ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function Detail({ label, value, bold, span }: { label: string; value: string; bold?: boolean; span?: number }) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <span className="text-xs text-gray-400">{label}: </span>
      <span className={bold ? "font-semibold text-gray-900" : "text-gray-700"}>{value}</span>
    </div>
  );
}

function EmptyState({ message, cta }: { message: string; cta: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white border py-16 text-center shadow-sm">
      <p className="text-gray-500 mb-4">{message}</p>
      <Link href={cta.href} className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800">
        {cta.label}
      </Link>
    </div>
  );
}
