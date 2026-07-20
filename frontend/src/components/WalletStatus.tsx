// components/WalletStatus.tsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface WalletData {
  balance: number;
  totalSpent: number;
}

export const WalletStatus = ({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await api.get("/wallet/balance", token);
        setWallet(data);
      } catch (error) {
        console.error("Failed to fetch wallet:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [userId, token]);

  if (loading) return <div className="animate-pulse">Loading wallet...</div>;
  if (!wallet) return <div>No wallet found</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Available Balance</p>
          <p className="text-2xl font-bold text-primary">
            R{wallet.balance.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => {
            /* Open top-up modal */
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition"
        >
          Top Up
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Total spent: R{wallet.totalSpent.toFixed(2)}
      </p>
    </div>
  );
};
