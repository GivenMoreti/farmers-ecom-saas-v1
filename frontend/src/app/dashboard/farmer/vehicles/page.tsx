"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFarmerAuth } from "../FarmerAuthContext";

interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  modelYear?: number;
}

export default function FarmerVehiclesPage() {
  const { token } = useFarmerAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ registrationNumber: "", type: "BAKKIE", make: "", model: "", modelYear: "" });

  const loadVehicles = async () => {
    const data = await api.get("/vehicles/farmer", token);
    setVehicles(data || []);
  };

  const addVehicle = async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const inputClass =
    "rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Vehicles</h1>
      <p className="mt-1 text-sm text-gray-500">Register the vehicles you use to fulfill deliveries.</p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-5">
        <input className={inputClass} placeholder="Registration" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
        <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="BAKKIE">Bakkie</option>
          <option value="VAN">Van</option>
          <option value="TRUCK">Truck</option>
          <option value="MOTORBIKE">Motorbike</option>
          <option value="OTHER">Other</option>
        </select>
        <input className={inputClass} placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        <input className={inputClass} placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <div className="flex gap-2">
          <input className={`${inputClass} w-full`} placeholder="Year" value={form.modelYear} onChange={(e) => setForm({ ...form, modelYear: e.target.value })} />
          <button className="rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90" onClick={addVehicle}>Add</button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {vehicles.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No vehicles registered yet.
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="font-medium text-gray-900">{vehicle.registrationNumber} ({vehicle.type})</p>
              <p className="mt-1 text-sm text-gray-500">{vehicle.make} {vehicle.model} {vehicle.modelYear || ""}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
