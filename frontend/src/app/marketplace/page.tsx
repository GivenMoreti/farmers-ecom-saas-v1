// app/marketplace/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  breed?: string;
  price: number;
  farmName: string;
  categoryName: string;
  media: string[];
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

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    query: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.query) params.append("query", filters.query);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);

      const response = await fetch(`/api/products/public/search?${params}`);
      const data = await response.json();
      setProducts(data.content || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
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
      <h1 className="text-3xl font-bold mb-6">Find What You're Looking For</h1>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">All Categories</option>
            <option value="cattle">Cattle</option>
            <option value="goats">Goats</option>
            <option value="sheep">Sheep</option>
            <option value="poultry">Poultry</option>
            <option value="crops">Crops</option>
          </select>
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
            }
            className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
            className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
          <button
            onClick={fetchProducts}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            No products found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/marketplace/product/${product.id}`}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
            >
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {product.media && product.media.length > 0 ? (
                  <img
                    src={product.media[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">
                    {product.categoryName === "cattle" && "🐄"}
                    {product.categoryName === "goats" && "🐐"}
                    {product.categoryName === "sheep" && "🐑"}
                    {product.categoryName === "poultry" && "🐔"}
                    {product.categoryName === "crops" && "🌾"}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                {product.breed && (
                  <p className="text-sm text-gray-500">{product.breed}</p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xl font-bold text-primary">
                    R{product.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {product.farmName}
                  </span>
                </div>
                {product.livestockDetails && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="mr-3">
                      Age: {product.livestockDetails.ageMonths}mo
                    </span>
                    <span>Weight: {product.livestockDetails.weightKg}kg</span>
                  </div>
                )}
                {product.cropDetails && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="mr-3">
                      Qty: {product.cropDetails.quantityKg}kg
                    </span>
                    <span>Harvest: {product.cropDetails.harvestDate}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
