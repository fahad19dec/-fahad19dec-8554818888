import { useCallback, useSyncExternalStore } from "react";

// Hearted stays for this session only. Nothing is saved yet: favorites reset
// when the app restarts, until they're persisted per guest.
const saved = new Set<string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useFavorite(id: string) {
  const isSaved = useSyncExternalStore(subscribe, () => saved.has(id));
  const toggle = useCallback(() => {
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    listeners.forEach((listener) => listener());
  }, [id]);
  return [isSaved, toggle] as const;
}

/** How many stays are hearted this session. */
export function useFavoriteCount() {
  return useSyncExternalStore(subscribe, () => saved.size);
}
