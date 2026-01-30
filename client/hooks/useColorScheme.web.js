import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

let isClient = false;
if (typeof window !== "undefined") {
  isClient = true;
}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const [hydratedColorScheme, setHydratedColorScheme] = useState(null);

  useEffect(() => {
    setHydratedColorScheme(colorScheme);
  }, [colorScheme]);

  // Return the hydrated value if available, otherwise fall back to the current value
  return hydratedColorScheme || colorScheme || "light";
}
