// app/dashboard/farmer/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Package, CheckCircle2, Radio } from "lucide-react";
import { WalletStatus } from "@/components/WalletStatus";
import { ProductListingForm } from "@/components/ProductListingForm";
import { api } from "@/lib/api";
import { useFarmerAuth } from "./FarmerAuthContext";

interface Product {
  id: string;
  name: string;
  price: number;
  isListed: boolean;
  status: string;
  soldAt: string | null;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tint: "green" | "blue" | "amber";
}) {
  const tints = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${tints[tint]}`}>
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400">{label}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { user, token } = useFarmerAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showListingForm, setShowListingForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const productsData = await api.get("/products/farmer/list", token);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleListing = async (productId: string, currentStatus: boolean) => {
    try {
      await api.post(`/products/farmer/${productId}/toggle`, {}, token);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isListed: !currentStatus } : p,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle listing:", error);
      alert((error as Error).message || "Failed to toggle listing");
    }
  };

  const markAsSold = async (productId: string) => {
    if (!confirm("Mark this product as sold?")) return;

    try {
      await api.post(`/products/farmer/${productId}/mark-sold`, {}, token);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, status: "SOLD", soldAt: new Date().toISOString() }
            : p,
        ),
      );
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    }
  };

  const listedCount = products.filter((p) => p.isListed && p.status !== "SOLD").length;
  const soldCount = products.filter((p) => p.status === "SOLD").length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back, {user.displayName || user.email}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening with your farm listings today.
          </p>
        </div>
        <button
          onClick={() => setShowListingForm((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="size-4" />
          List new product
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total listings" value={products.length} icon={Package} tint="blue" />
        <StatCard label="Currently listed" value={listedCount} icon={Radio} tint="green" />
        <StatCard label="Sold" value={soldCount} icon={CheckCircle2} tint="amber" />
      </div>

      <div className="mt-6">
        <WalletStatus userId={user.userId} token={token} />
      </div>

      {showListingForm && (
        <div className="mt-6">
          <ProductListingForm
            token={token}
            onSuccess={() => {
              setShowListingForm(false);
              fetchProducts();
            }}
          />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Your products</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {products.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              You haven&apos;t listed any products yet. Click &ldquo;List new product&rdquo; to get
              started.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">R{product.price.toFixed(2)}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.status === "SOLD"
                          ? "bg-green-100 text-green-800"
                          : product.isListed
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.status === "SOLD"
                        ? "Sold"
                        : product.isListed
                          ? "Listed"
                          : "Unlisted"}
                    </span>
                    {product.soldAt && (
                      <span className="text-xs text-gray-400">
                        Sold {new Date(product.soldAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {product.status !== "SOLD" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleListing(product.id, product.isListed)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        product.isListed
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {product.isListed ? "Unlist" : "List"}
                    </button>
                    <button
                      onClick={() => markAsSold(product.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                      Mark sold
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
