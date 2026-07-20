"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Favorite {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    media?: string[];
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem("token") || "";
    if (!token) return;
    const data = await api.get("/favorites", token);
    setFavorites(data || []);
  };

  const removeFavorite = async (productId: string) => {
    const token = localStorage.getItem("token") || "";
    await api.delete(`/favorites/${productId}`, token);
    await load();
  };

  useEffect(() => {
    load()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading favorites...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Favorites</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((favorite) => (
          <div key={favorite.id} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">{favorite.product?.name || "Product"}</h3>
            <p className="text-sm text-gray-600">R{Number(favorite.product?.price || 0).toFixed(2)}</p>
            <button
              onClick={() => removeFavorite(favorite.product.id)}
              className="mt-3 px-3 py-2 bg-red-500 text-white rounded"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
