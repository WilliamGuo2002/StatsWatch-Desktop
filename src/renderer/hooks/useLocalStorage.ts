import { useState, useCallback } from 'react';
import type { FavoritePlayer, SearchHistoryItem, StatSnapshot, ActiveSession, GameMode } from '../types/models';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Favorites ----
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritePlayer[]>(() =>
    readStorage('sw_favorites', [])
  );

  const addFavorite = useCallback((player: Omit<FavoritePlayer, 'addedAt'>) => {
    setFavorites(prev => {
      const filtered = prev.filter(f => f.playerId !== player.playerId);
      const next = [{ ...player, addedAt: new Date().toISOString() }, ...filtered];
      writeStorage('sw_favorites', next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((playerId: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.playerId !== playerId);
      writeStorage('sw_favorites', next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (playerId: string) => favorites.some(f => f.playerId === playerId),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}

// ---- Search History ----
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() =>
    readStorage('sw_search_history', [])
  );

  const addToHistory = useCallback((item: Omit<SearchHistoryItem, 'searchedAt'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.playerId !== item.playerId);
      const next = [{ ...item, searchedAt: new Date().toISOString() }, ...filtered].slice(0, 20);
      writeStorage('sw_search_history', next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeStorage('sw_search_history', []);
  }, []);

  return { history, addToHistory, clearHistory };
}

// ---- Stat Snapshots ----
export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<StatSnapshot[]>(() =>
    readStorage('sw_stat_snapshots', [])
  );

  const addSnapshot = useCallback((snapshot: Omit<StatSnapshot, 'id'>) => {
    setSnapshots(prev => {
      const today = new Date().toISOString().split('T')[0];
      const exists = prev.some(
        s => s.playerId === snapshot.playerId &&
          s.gamemode === snapshot.gamemode &&
          s.date.startsWith(today)
      );
      if (exists) return prev;

      const newSnap: StatSnapshot = {
        ...snapshot,
        id: `${snapshot.playerId}_${snapshot.gamemode}_${Date.now()}`,
      };
      const next = [newSnap, ...prev];
      writeStorage('sw_stat_snapshots', next);
      return next;
    });
  }, []);

  const getSnapshotsForPlayer = useCallback(
    (playerId: string) =>
      snapshots
        .filter(s => s.playerId === playerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [snapshots]
  );

  return { snapshots, addSnapshot, getSnapshotsForPlayer };
}

// ---- Active Session ----
export function useActiveSession(playerId: string) {
  const key = `sw_active_session_${playerId}`;

  const [session, setSession] = useState<ActiveSession | null>(() =>
    readStorage(key, null)
  );

  const startSession = useCallback((gamemode: GameMode, startSnapshot: ActiveSession['startSnapshot']) => {
    const newSession: ActiveSession = {
      playerId,
      startedAt: new Date().toISOString(),
      gamemode,
      startSnapshot,
    };
    writeStorage(key, newSession);
    setSession(newSession);
  }, [playerId, key]);

  const endSession = useCallback(() => {
    localStorage.removeItem(key);
    setSession(null);
  }, [key]);

  return { session, startSession, endSession };
}
