"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    const token = localStorage.getItem("token") || "";
    const data = await api.get("/orders/farmer", token);
    const filtered = (data || []).filter((o: Order) => o.farmerDeliverySelected);
    setOrders(filtered);
    if (filtered.length > 0 && !selectedOrderId) {
      setSelectedOrderId(filtered[0].id);
    }
  };

  const loadDeliveries = async (orderId: string) => {
    const token = localStorage.getItem("token") || "";
    if (!orderId) return;
    const data = await api.get(`/deliveries/order/${orderId}`, token);
    setDeliveries(data || []);
  };

  const createDelivery = async () => {
    const token = localStorage.getItem("token") || "";
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
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      loadDeliveries(selectedOrderId).catch(console.error);
    }
  }, [selectedOrderId]);

  if (loading) return <div className="p-6">Loading deliveries...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Farmer Delivery Tracking</h1>
      <div className="mb-4 flex gap-3">
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.id.slice(0, 8)} - {order.deliveryAddress}
            </option>
          ))}
        </select>
        <button onClick={createDelivery} className="px-4 py-2 bg-primary text-white rounded">
          Create Delivery
        </button>
      </div>

      <div className="space-y-3">
        {deliveries.length === 0 ? (
          <div className="p-4 bg-white rounded shadow">No deliveries for this order.</div>
        ) : (
          deliveries.map((delivery) => (
            <div key={delivery.id} className="p-4 bg-white rounded shadow">
              <p className="font-semibold">Tracking: {delivery.trackingCode}</p>
              <p className="text-sm text-gray-600">Status: {delivery.status}</p>
              <p className="text-sm text-gray-600">Dropoff: {delivery.dropoffAddress}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
