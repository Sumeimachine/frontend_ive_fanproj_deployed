import { useEffect, useState } from "react";

type NetworkInformation = EventTarget & {
  saveData?: boolean;
  effectiveType?: string;
};

const getConnection = () =>
  (navigator as Navigator & { connection?: NetworkInformation }).connection;

export const usePerformancePreferences = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [prefersReducedData, setPrefersReducedData] = useState(() => {
    const connection = getConnection();
    return Boolean(connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g");
  });

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dataQuery = window.matchMedia("(prefers-reduced-data: reduce)");
    const connection = getConnection();

    const updatePreferences = () => {
      setPrefersReducedMotion(motionQuery.matches);
      setPrefersReducedData(Boolean(
        dataQuery.matches
        || connection?.saveData
        || connection?.effectiveType === "slow-2g"
        || connection?.effectiveType === "2g",
      ));
    };

    motionQuery.addEventListener("change", updatePreferences);
    dataQuery.addEventListener("change", updatePreferences);
    connection?.addEventListener("change", updatePreferences);

    return () => {
      motionQuery.removeEventListener("change", updatePreferences);
      dataQuery.removeEventListener("change", updatePreferences);
      connection?.removeEventListener("change", updatePreferences);
    };
  }, []);

  return { prefersReducedMotion, prefersReducedData };
};
