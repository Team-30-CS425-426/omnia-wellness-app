import React, { createContext, useContext } from "react";
import useActiveEnergyData from "@/src/hooks/useActiveEnergyData";

type ActiveEnergyContextType = ReturnType<typeof useActiveEnergyData>;

const ActiveEnergyContext = createContext<ActiveEnergyContextType | null>(null);

export function ActiveEnergyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeEnergy = useActiveEnergyData();

  return (
    <ActiveEnergyContext.Provider value={activeEnergy}>
      {children}
    </ActiveEnergyContext.Provider>
  );
}

export function useActiveEnergyContext() {
  const ctx = useContext(ActiveEnergyContext);

  if (!ctx) {
    throw new Error("useActiveEnergyContext must be used within ActiveEnergyProvider");
  }

  return ctx;
}