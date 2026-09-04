"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFarmerAuth } from "../FarmerAuthContext";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  farmerDeliverySelected: boolean;
}

export default function FarmerOrdersPage() {
  const { token } = useFarmerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.get("/orders/farmer", token);
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load farmer orders", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const moveStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status }, token);
      await loadOrders();
    } catch (error) {
      console.error("Failed to update order status", error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">Track and update orders placed against your listings.</p>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No orders yet.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm text-gray-500">Total: R{Number(order.totalAmount || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Delivery selected: {order.farmerDeliverySelected ? "Yes" : "No"}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{order.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => moveStatus(order.id, "PAID")} className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600">Mark paid</button>
                <button onClick={() => moveStatus(order.id, "DELIVERED")} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-600">Mark delivered</button>
                <button onClick={() => moveStatus(order.id, "COMPLETED")} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-600">Complete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
