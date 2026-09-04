// app/marketplace/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  breed?: string;
  price: number;
  farmName: string;
  categoryName: string;
  media: string[];
  averageRating?: number;
  reviewCount?: number;
  distanceKm?: number;
  recommendationScore?: number;
  livestockDetails?: {
    species: string;
    ageMonths: number;
    weightKg: number;
  };
  cropDetails?: {
    quantityKg: number;
    harvestDate: string;
  };
}

const CATEGORY_ICON: Record<string, string> = {
  cattle: "🐄",
  goats: "🐐",
  sheep: "🐑",
  poultry: "🐔",
  pigs: "🐖",
  crops: "🌾",
};

const CATEGORY_OPTIONS = ["cattle", "goats", "sheep", "poultry", "pigs", "crops"];

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  const value = rating ?? 0;
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span className="text-amber-500">★</span>
      <span className="font-medium text-gray-700">{value.toFixed(1)}</span>
      <span>({count ?? 0})</span>
    </div>
  );
}

function ProductCard({
  product,
  onFavorite,
  onOrder,
}: {
  product: Product;
  onFavorite: (id: string) => void;
  onOrder: (product: Product) => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-44 bg-gradient-to-br from-green-50 to-amber-50">
        {product.media && product.media.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.media[0]} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            {CATEGORY_ICON[product.categoryName] ?? "📦"}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(product.id);
          }}
          title="Save to favourites"
          className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 text-amber-500 shadow-sm backdrop-blur transition hover:bg-white"
        >
          ♥
        </button>
        {product.distanceKm != null && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
            {product.distanceKm.toFixed(1)} km away
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-gray-900">{product.name}</h3>
            {product.breed && <p className="truncate text-xs text-gray-500">{product.breed}</p>}
          </div>
          <span className="whitespace-nowrap text-lg font-bold text-green-700">
            R{product.price.toFixed(2)}
          </span>
        </div>

        <p className="truncate text-xs text-gray-400">{product.farmName}</p>
        <StarRating rating={product.averageRating} count={product.reviewCount} />

        {product.livestockDetails && (
          <div className="flex gap-3 text-xs text-gray-500">
            <span>{product.livestockDetails.ageMonths}mo</span>
            <span>{product.livestockDetails.weightKg}kg</span>
          </div>
        )}
        {product.cropDetails && (
          <div className="flex gap-3 text-xs text-gray-500">
            <span>{product.cropDetails.quantityKg}kg available</span>
          </div>
        )}

        <button
          onClick={() => onOrder(product)}
          className="mt-auto w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Order now
        </button>
      </div>
    </div>
  );
}

function OrderModal({
  product,
  submitting,
  onClose,
  onSubmit,
}: {
  product: Product;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (details: {
    deliveryAddress: string;
    deliveryInstructions: string;
    farmerDeliverySelected: boolean;
    farmerDeliveryFee: number;
  }) => void;
}) {
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [farmerDelivery, setFarmerDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }
    onSubmit({
      deliveryAddress: deliveryAddress.trim(),
      deliveryInstructions: deliveryInstructions.trim(),
      farmerDeliverySelected: farmerDelivery,
      farmerDeliveryFee: farmerDelivery ? Number(deliveryFee || 0) : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Order {product.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          From {product.farmName} · R{product.price.toFixed(2)}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Delivery address *
            </label>
            <textarea
              required
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Street, suburb, city"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Delivery instructions
            </label>
            <input
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="Gate code, preferred time, etc. (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={farmerDelivery}
              onChange={(e) => setFarmerDelivery(e.target.checked)}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Use farmer delivery, if offered
          </label>

          {farmerDelivery && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Delivery fee (R)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderTarget, setOrderTarget] = useState<Product | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    query: "",
    latitude: "",
    longitude: "",
    radiusKm: "",
    minRating: "",
    minPrice: "",
    maxPrice: "",
  });

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.query) params.append("query", filters.query);
      if (filters.latitude) params.append("latitude", filters.latitude);
      if (filters.longitude) params.append("longitude", filters.longitude);
      if (filters.radiusKm) params.append("radiusKm", filters.radiusKm);
      if (filters.minRating) params.append("minRating", filters.minRating);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);

      const data = await api.get(`/products/public/search?${params.toString()}`);
      setProducts(data.content || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Couldn't load the marketplace right now.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addFavorite = async (productId: string) => {
    const token = localStorage.getItem("token") || "";
    if (!token) {
      toast.error("Sign in to save favourites");
      return;
    }

    try {
      await api.post(`/favorites/${productId}`, {}, token);
      toast.success("Added to favourites");
    } catch (error) {
      toast.error((error as Error).message || "Could not add favourite");
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          radiusKm: prev.radiusKm || "100",
        }));
        toast.success("Using your current location");
      },
      () => {
        toast.error("Unable to fetch your location.");
      },
    );
  };

  const submitOrder = async (details: {
    deliveryAddress: string;
    deliveryInstructions: string;
    farmerDeliverySelected: boolean;
    farmerDeliveryFee: number;
  }) => {
    const token = localStorage.getItem("token") || "";
    if (!token) {
      toast.error("Sign in to place an order");
      return;
    }
    if (!orderTarget) return;

    setSubmitting(true);
    try {
      await api.post(
        "/orders",
        {
          productId: orderTarget.id,
          ...details,
        },
        token,
      );
      toast.success("Order placed!");
      setOrderTarget(null);
    } catch (error) {
      toast.error((error as Error).message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        Find fresh produce and livestock
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Browse listings from farmers near you, filtered by product, price, and rating.
      </p>

      {/* Search & Filters */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by product, breed, farm…"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
            className={`min-w-[220px] flex-1 ${inputClass}`}
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className={inputClass}
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_ICON[c]} {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowMoreFilters((v) => !v)}
            className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {showMoreFilters ? "Fewer filters" : "More filters"}
          </button>
          <button
            onClick={fetchProducts}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Search
          </button>
        </div>

        {showMoreFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <input
              type="number"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className={`w-28 ${inputClass}`}
            />
            <input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className={`w-28 ${inputClass}`}
            />
            <input
              type="number"
              placeholder="Min rating"
              min="0"
              max="5"
              step="0.1"
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
              className={`w-28 ${inputClass}`}
            />
            <input
              type="number"
              placeholder="Radius (km)"
              value={filters.radiusKm}
              onChange={(e) => setFilters({ ...filters, radiusKm: e.target.value })}
              className={`w-32 ${inputClass}`}
            />
            <button
              onClick={useMyLocation}
              className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              📍 Use my location
            </button>
            {filters.latitude && (
              <span className="text-xs text-gray-400">
                Searching near {filters.latitude}, {filters.longitude}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 text-gray-500">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onFavorite={addFavorite}
              onOrder={setOrderTarget}
            />
          ))}
        </div>
      )}

      {orderTarget && (
        <OrderModal
          product={orderTarget}
          submitting={submitting}
          onClose={() => setOrderTarget(null)}
          onSubmit={submitOrder}
        />
      )}
    </div>
  );
}
