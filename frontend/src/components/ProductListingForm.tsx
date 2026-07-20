// components/ProductListingForm.tsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ProductFormData {
  name: string;
  breed: string;
  description: string;
  price: number;
  categoryId: string;
  dailyListingFee: number;
  isListed: boolean;
  livestockDetails?: {
    species: string;
    ageMonths: number;
    weightKg: number;
    vaccinationStatus: string;
  };
  cropDetails?: {
    quantityKg: number;
    harvestDate: string;
    growingMethod: string;
  };
}

interface CategoryOption {
  id: string;
  name: string;
}

export const ProductListingForm = ({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    breed: "",
    description: "",
    price: 0,
    categoryId: "",
    dailyListingFee: 1.0,
    isListed: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productType, setProductType] = useState<"livestock" | "crop">(
    "livestock",
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.get("/categories");
        setCategories(data || []);
        if (data?.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: prev.categoryId || data[0].id }));
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post(
        "/products/farmer/create",
        {
          ...formData,
          categoryId: formData.categoryId,
          // Add livestock or crop details based on type
          ...(productType === "livestock" && {
            livestockDetails: formData.livestockDetails,
          }),
          ...(productType === "crop" && {
            cropDetails: formData.cropDetails,
          }),
        },
        token,
      );

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-4">List Your Product</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Product Type Selection */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setProductType("livestock")}
            className={`flex-1 py-2 rounded-lg border transition ${
              productType === "livestock"
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            🐄 Livestock
          </button>
          <button
            type="button"
            onClick={() => setProductType("crop")}
            className={`flex-1 py-2 rounded-lg border transition ${
              productType === "crop"
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            🌾 Crops
          </button>
        </div>

        {/* Common Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            placeholder="e.g., Nguni Cattle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            required
          >
            {categories.length === 0 ? (
              <option value="">No categories available</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Breed
          </label>
          <input
            type="text"
            value={formData.breed}
            onChange={(e) =>
              setFormData({ ...formData, breed: e.target.value })
            }
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            placeholder="e.g., Nguni, Boer Goat"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            placeholder="Describe your product, age, health status, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price (R) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) })
              }
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Daily Listing Fee (R)
            </label>
            <input
              type="number"
              step="0.50"
              min="0.50"
              value={formData.dailyListingFee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dailyListingFee: parseFloat(e.target.value),
                })
              }
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            <p className="text-xs text-gray-400 mt-1">Default: R1.00/day</p>
          </div>
        </div>

        {/* Livestock-specific fields */}
        {productType === "livestock" && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Livestock Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Species *
                </label>
                <select
                  value={formData.livestockDetails?.species || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livestockDetails: {
                        ...formData.livestockDetails,
                        species: e.target.value,
                      } as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="CATTLE">Cattle</option>
                  <option value="GOAT">Goat</option>
                  <option value="SHEEP">Sheep</option>
                  <option value="PIG">Pig</option>
                  <option value="POULTRY">Poultry</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Age (months)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.livestockDetails?.ageMonths || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livestockDetails: {
                        ...formData.livestockDetails,
                        ageMonths: parseInt(e.target.value),
                      } as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.livestockDetails?.weightKg || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livestockDetails: {
                        ...formData.livestockDetails,
                        weightKg: parseFloat(e.target.value),
                      } as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vaccination Status
                </label>
                <select
                  value={
                    formData.livestockDetails?.vaccinationStatus ||
                    "UNVACCINATED"
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livestockDetails: {
                        ...formData.livestockDetails,
                        vaccinationStatus: e.target.value,
                      } as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="VACCINATED">Vaccinated</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="UNVACCINATED">Unvaccinated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Crop-specific fields */}
        {productType === "crop" && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Crop Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0"
                  value={formData.cropDetails?.quantityKg || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cropDetails: {
                        ...formData.cropDetails,
                        quantityKg: parseFloat(e.target.value),
                      } as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Harvest Date
                </label>
                <input
                  type="date"
                  value={formData.cropDetails?.harvestDate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cropDetails: {
                        ...formData.cropDetails,
                        harvestDate: e.target.value,
                      } as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Growing Method
                </label>
                <select
                  value={formData.cropDetails?.growingMethod || "CONVENTIONAL"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cropDetails: {
                        ...formData.cropDetails,
                        growingMethod: e.target.value,
                      } as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="ORGANIC">Organic</option>
                  <option value="CONVENTIONAL">Conventional</option>
                  <option value="HYDROPONIC">Hydroponic</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 border-t pt-4 mt-4">
          <input
            type="checkbox"
            checked={formData.isListed}
            onChange={(e) =>
              setFormData({ ...formData, isListed: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label className="text-sm text-gray-700">
            List immediately (start paying daily fee)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? "Listing..." : "List Product"}
        </button>
      </div>
    </form>
  );
};
