import { useEffect, useState } from 'react';

const FAVORITES_KEY = 'stockroom.favorites';

function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggle = (id: string) =>
    setFavorites((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const prune = (ids: string[]) =>
    setFavorites((prev) => {
      const next = prev.filter((id) => ids.includes(id));
      return next.length === prev.length ? prev : next;
    });

  const add = (ids: string[]) => setFavorites((prev) => [...new Set([...prev, ...ids])]);

  return { favorites, toggle, add, prune };
}
