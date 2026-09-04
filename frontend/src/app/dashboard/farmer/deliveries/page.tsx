"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFarmerAuth } from "../FarmerAuthContext";

interface Order {
  id: string;
  deliveryAddress: string;
  farmerDeliverySelected: boolean;
}

interface Delivery {
  id: string;
  status: string;
  trackingCode: string;
  dropoffAddress: string;
}

export default function FarmerDeliveriesPage() {
  const { token } = useFarmerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    const data = await api.get("/orders/farmer", token);
    const filtered = (data || []).filter((o: Order) => o.farmerDeliverySelected);
    setOrders(filtered);
    if (filtered.length > 0 && !selectedOrderId) {
      setSelectedOrderId(filtered[0].id);
    }
  };

  const loadDeliveries = async (orderId: string) => {
    if (!orderId) return;
    const data = await api.get(`/deliveries/order/${orderId}`, token);
    setDeliveries(data || []);
  };

  const createDelivery = async () => {
    if (!selectedOrderId) return;
    await api.post(
      "/deliveries",
      {
        orderId: selectedOrderId,
        pickupAddress: "Farm pickup",
        dropoffAddress: orders.find((o) => o.id === selectedOrderId)?.deliveryAddress || "Customer address",
      },
      token,
    );
    await loadDeliveries(selectedOrderId);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadOrders();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedOrderId) {
      loadDeliveries(selectedOrderId).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Deliveries</h1>
      <p className="mt-1 text-sm text-gray-500">Create and track deliveries for orders you&apos;re fulfilling.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.id.slice(0, 8)} - {order.deliveryAddress}
            </option>
          ))}
        </select>
        <button onClick={createDelivery} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90">
          Create delivery
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {deliveries.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No deliveries for this order.
          </div>
        ) : (
          deliveries.map((delivery) => (
            <div key={delivery.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="font-medium text-gray-900">Tracking: {delivery.trackingCode}</p>
              <p className="mt-1 text-sm text-gray-500">Status: {delivery.status}</p>
              <p className="text-sm text-gray-500">Dropoff: {delivery.dropoffAddress}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
