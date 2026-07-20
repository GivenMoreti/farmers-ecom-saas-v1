"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  farmerDeliverySelected: boolean;
  farmerDeliveryFee?: number;
  product?: { name?: string };
}

export default function BuyerDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token") || "";
      if (!token) return;

      try {
        const data = await api.get("/orders/buyer", token);
        setOrders(data || []);
      } catch (error) {
        console.error("Failed to load buyer orders", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading buyer dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Buyer Dashboard</h1>
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="p-4 bg-white rounded-lg shadow">No orders yet.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between">
                <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{order.status}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Product: {order.product?.name || "N/A"}</p>
              <p className="text-sm text-gray-600">Total: R{Number(order.totalAmount || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-600">Delivery: {order.deliveryAddress || "N/A"}</p>
              <p className="text-sm text-gray-600">Farmer delivery: {order.farmerDeliverySelected ? "Yes" : "No"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
