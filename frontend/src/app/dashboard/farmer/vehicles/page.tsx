"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  modelYear?: number;
}

export default function FarmerVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ registrationNumber: "", type: "BAKKIE", make: "", model: "", modelYear: "" });

  const loadVehicles = async () => {
    const token = localStorage.getItem("token") || "";
    const data = await api.get("/vehicles/farmer", token);
    setVehicles(data || []);
  };

  const addVehicle = async () => {
    const token = localStorage.getItem("token") || "";
    await api.post(
      "/vehicles/farmer",
      {
        registrationNumber: form.registrationNumber,
        type: form.type,
        make: form.make,
        model: form.model,
        modelYear: form.modelYear ? Number(form.modelYear) : null,
      },
      token,
    );
    setForm({ registrationNumber: "", type: "BAKKIE", make: "", model: "", modelYear: "" });
    await loadVehicles();
  };

  useEffect(() => {
    loadVehicles().catch(console.error);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Farmer Vehicles</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6 grid gap-3 md:grid-cols-5">
        <input className="border rounded px-3 py-2" placeholder="Registration" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
        <select className="border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="BAKKIE">Bakkie</option>
          <option value="VAN">Van</option>
          <option value="TRUCK">Truck</option>
          <option value="MOTORBIKE">Motorbike</option>
          <option value="OTHER">Other</option>
        </select>
        <input className="border rounded px-3 py-2" placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2 w-full" placeholder="Year" value={form.modelYear} onChange={(e) => setForm({ ...form, modelYear: e.target.value })} />
          <button className="px-3 py-2 bg-primary text-white rounded" onClick={addVehicle}>Add</button>
        </div>
      </div>

      <div className="space-y-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-lg shadow p-4">
            <p className="font-semibold">{vehicle.registrationNumber} ({vehicle.type})</p>
            <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model} {vehicle.modelYear || ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
