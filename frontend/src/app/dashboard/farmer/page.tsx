// app/dashboard/farmer/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WalletStatus } from "@/components/WalletStatus";
import { ProductListingForm } from "@/components/ProductListingForm";

interface Product {
  id: string;
  name: string;
  price: number;
  isListed: boolean;
  status: string;
  soldAt: string | null;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showListingForm, setShowListingForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    // Fetch user and products
    fetchUserAndProducts();
  }, []);

  const fetchUserAndProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const userRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      setUser(userData);

      const productsRes = await fetch("/api/products/farmer/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productsData = await productsRes.json();
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleListing = async (productId: string, currentStatus: boolean) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/products/farmer/${productId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isListed: !currentStatus }),
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, isListed: !currentStatus } : p,
          ),
        );
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (error) {
      console.error("Failed to toggle listing:", error);
    }
  };

  const markAsSold = async (productId: string) => {
    if (!confirm("Mark this product as sold?")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `/api/products/farmer/${productId}/mark-sold`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, status: "SOLD", soldAt: new Date().toISOString() }
              : p,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Farmer Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowListingForm(!showListingForm)}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            + List New Product
          </button>
        </div>
      </div>

      {/* Wallet Status */}
      <div className="mb-6">
        <WalletStatus
          userId={user?.userId}
          token={localStorage.getItem("token") || ""}
        />
      </div>

      {/* Listing Form */}
      {showListingForm && (
        <div className="mb-6">
          <ProductListingForm
            userId={user?.userId}
            token={localStorage.getItem("token") || ""}
            onSuccess={() => {
              setShowListingForm(false);
              fetchUserAndProducts();
            }}
          />
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Your Products</h2>
        </div>
        <div className="divide-y">
          {products.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              You haven't listed any products yet. Click the button above to get
              started.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="p-6 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <div className="text-sm text-gray-500">
                    <span className="mr-4">R{product.price.toFixed(2)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.status === "SOLD"
                          ? "bg-green-100 text-green-800"
                          : product.isListed
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.status === "SOLD"
                        ? "Sold"
                        : product.isListed
                          ? "Listed"
                          : "Unlisted"}
                    </span>
                    {product.soldAt && (
                      <span className="ml-3 text-xs text-gray-400">
                        Sold: {new Date(product.soldAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {product.status !== "SOLD" && (
                    <>
                      <button
                        onClick={() =>
                          toggleListing(product.id, product.isListed)
                        }
                        className={`px-4 py-2 rounded-lg text-sm transition ${
                          product.isListed
                            ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            : "bg-primary text-white hover:bg-primary/90"
                        }`}
                      >
                        {product.isListed ? "Unlist" : "List"}
                      </button>
                      <button
                        onClick={() => markAsSold(product.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition"
                      >
                        Mark Sold
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
