import { useEffect, useState } from "react";

/** False during server render and the first client render; true after that. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
