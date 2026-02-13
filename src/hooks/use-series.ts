"use client";

import { useState, useEffect, useCallback } from 'react';
import { WatchHistoryItem } from './use-watch-history';

export type VideoInSeries = Pick<WatchHistoryItem, 'id' | 'title' | 'sourceType' | 'sourceValue' | 'durationSeconds'>;

export interface Series {
  id: string;
  title: string;
  videos: VideoInSeries[];
  updatedAt: number;
}

const SERIES_KEY = 'video-series';

export function useSeries() {
    const [series, setSeries] = useState<Series[]>([]);

    useEffect(() => {
        try {
        const storedSeries = localStorage.getItem(SERIES_KEY);
        if (storedSeries) {
            setSeries(JSON.parse(storedSeries));
        }
        } catch (error) {
        console.error('Error reading series from localStorage', error);
        }
    }, []);

    const saveSeries = useCallback((newSeries: Series[]) => {
        try {
            const sorted = newSeries.sort((a, b) => b.updatedAt - a.updatedAt);
            localStorage.setItem(SERIES_KEY, JSON.stringify(sorted));
            setSeries(sorted);
        } catch (error) {
            console.error('Error saving series to localStorage', error);
        }
    }, []);
    
    const createSeries = useCallback((title: string) => {
        if (!title.trim()) return;
        const newSeries: Series = {
            id: crypto.randomUUID(),
            title: title.trim(),
            videos: [],
            updatedAt: Date.now(),
        };
        const updatedSeries = [newSeries, ...series];
        saveSeries(updatedSeries);
        return newSeries;
    }, [series, saveSeries]);

    const deleteSeries = useCallback((seriesId: string) => {
        const newSeries = series.filter(s => s.id !== seriesId);
        saveSeries(newSeries);
    }, [series, saveSeries]);

    const addVideoToSeries = useCallback((seriesId: string, video: WatchHistoryItem) => {
        const newSeries = series.map(s => {
            if (s.id === seriesId) {
                const videoExists = s.videos.some(v => v.id === video.id);
                if (videoExists) {
                    return s; 
                }
                const videoToAdd: VideoInSeries = {
                    id: video.id,
                    title: video.title,
                    sourceType: video.sourceType,
                    sourceValue: video.sourceValue,
                    durationSeconds: video.durationSeconds
                };
                return { ...s, videos: [...s.videos, videoToAdd], updatedAt: Date.now() };
            }
            return s;
        });
        saveSeries(newSeries);
    }, [series, saveSeries]);
    
    const removeVideoFromSeries = useCallback((seriesId: string, videoId: string) => {
        const newSeries = series.map(s => {
            if (s.id === seriesId) {
                return {
                    ...s,
                    videos: s.videos.filter(v => v.id !== videoId),
                    updatedAt: Date.now()
                };
            }
            return s;
        });
        saveSeries(newSeries);
    }, [series, saveSeries]);

    return { series, createSeries, deleteSeries, addVideoToSeries, removeVideoFromSeries };
}
