"use client";

import { createContext, useContext, type ReactNode } from "react";

export type FarmerUser = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
};

export type FarmerAuthValue = {
  user: FarmerUser;
  token: string;
};

const FarmerAuthContext = createContext<FarmerAuthValue | null>(null);

export function FarmerAuthProvider({
  value,
  children,
}: {
  value: FarmerAuthValue;
  children: ReactNode;
}) {
  return (
    <FarmerAuthContext.Provider value={value}>{children}</FarmerAuthContext.Provider>
  );
}

export function useFarmerAuth() {
  const ctx = useContext(FarmerAuthContext);
  if (!ctx) {
    throw new Error("useFarmerAuth must be used within the farmer dashboard layout");
  }
  return ctx;
}
