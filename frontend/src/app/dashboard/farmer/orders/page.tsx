"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  farmerDeliverySelected: boolean;
}

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    const token = localStorage.getItem("token") || "";
    if (!token) return;

    try {
      const data = await api.get("/orders/farmer", token);
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load farmer orders", error);
    } finally {
      setLoading(false);
    }
  };

  const moveStatus = async (orderId: string, status: string) => {
    const token = localStorage.getItem("token") || "";
    try {
      await api.put(`/orders/${orderId}/status`, { status }, token);
      await loadOrders();
    } catch (error) {
      console.error("Failed to update order status", error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Farmer Orders</h1>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="p-4 bg-white rounded-lg shadow">No farmer orders yet.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">Total: R{Number(order.totalAmount || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Delivery selected: {order.farmerDeliverySelected ? "Yes" : "No"}</p>
                </div>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{order.status}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => moveStatus(order.id, "PAID")} className="px-3 py-1 bg-blue-500 text-white rounded">Mark Paid</button>
                <button onClick={() => moveStatus(order.id, "DELIVERED")} className="px-3 py-1 bg-emerald-500 text-white rounded">Mark Delivered</button>
                <button onClick={() => moveStatus(order.id, "COMPLETED")} className="px-3 py-1 bg-indigo-500 text-white rounded">Complete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
