"use client";

import { useState, useEffect, useCallback } from 'react';

export interface WatchHistoryItem {
  id: string;
  title: string;
  sourceType: 'url' | 'local';
  sourceValue: string;
  lastPositionSeconds: number;
  durationSeconds?: number;
  updatedAt: number;
}

const HISTORY_KEY = 'video-watch-history';

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error reading watch history from localStorage', error);
    }
  }, []);

  const saveHistory = useCallback((newHistory: WatchHistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('Error saving watch history to localStorage', error);
    }
  }, []);

  const addToHistory = useCallback((item: Omit<WatchHistoryItem, 'id' | 'updatedAt'>) => {
    const newItem: WatchHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
    };

    let newHistory;
    // For local files with object URLs, we treat them as unique to avoid incorrect merging.
    if (newItem.sourceType === 'local') {
      newHistory = [newItem, ...history];
    } else {
      const existingIndex = history.findIndex(
        (h) => h.sourceType === newItem.sourceType && h.sourceValue === newItem.sourceValue
      );

      newHistory = [...history];
      if (existingIndex !== -1) {
        // Update existing entry and move to top
        const existingItem = newHistory[existingIndex];
        newHistory.splice(existingIndex, 1);
        newHistory.unshift({ ...existingItem, ...newItem, id: existingItem.id, lastPositionSeconds: item.lastPositionSeconds || existingItem.lastPositionSeconds });
      } else {
        // Add new entry
        newHistory.unshift(newItem);
      }
    }
    
    // Sort by date and keep latest 100
    newHistory = newHistory
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 100);

    saveHistory(newHistory);
    return newHistory[0]; // return the item that was just added/updated
  }, [history, saveHistory]);

  const updateHistoryItem = useCallback((id: string, updates: Partial<Omit<WatchHistoryItem, 'id'>>) => {
    let itemFound = false;
    const newHistory = history.map((item) => {
      if (item.id === id) {
        itemFound = true;
        return { ...item, ...updates, updatedAt: Date.now() };
      }
      return item;
    });
    if (itemFound){
        saveHistory(newHistory.sort((a,b) => b.updatedAt - a.updatedAt));
    }
  }, [history, saveHistory]);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return { history, addToHistory, updateHistoryItem, clearHistory };
}
