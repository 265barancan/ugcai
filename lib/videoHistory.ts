import { VideoHistoryItem } from "@/types";
import { logger } from "./logger";

const STORAGE_KEY = "video_history";
const MAX_HISTORY_ITEMS = 50; // Maximum number of videos to keep in history

export function saveVideoToHistory(item: Omit<VideoHistoryItem, "id" | "createdAt">): string {
  const history = getVideoHistory();
  const newItem: VideoHistoryItem = {
    ...item,
    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    isFavorite: item.isFavorite || false,
  };

  // Add to beginning of array
  history.unshift(newItem);

  // Limit history size
  if (history.length > MAX_HISTORY_ITEMS) {
    history.splice(MAX_HISTORY_ITEMS);
  }

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    logger.error("Error saving video to history:", error);
    // If storage is full, try to remove oldest items
    if (error instanceof DOMException && error.code === 22) {
      const reducedHistory = history.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
    }
  }

  return newItem.id;
}

export function getVideoHistory(): VideoHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as VideoHistoryItem[];
    // Sort by creation date (newest first)
    return history.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    logger.error("Error reading video history:", error);
    return [];
  }
}

export function getFavoriteVideos(): VideoHistoryItem[] {
  const history = getVideoHistory();
  return history.filter((item) => item.isFavorite);
}

export function toggleFavorite(videoId: string): boolean {
  const history = getVideoHistory();
  const item = history.find((item) => item.id === videoId);
  
  if (!item) return false;

  item.isFavorite = !item.isFavorite;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return item.isFavorite;
  } catch (error) {
    logger.error("Error updating favorite status:", error);
    return false;
  }
}

export function deleteVideoFromHistory(videoId: string): boolean {
  const history = getVideoHistory();
  const filtered = history.filter((item) => item.id !== videoId);

  if (filtered.length === history.length) return false; // Item not found

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    logger.error("Error deleting video from history:", error);
    return false;
  }
}

export function clearVideoHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error("Error clearing video history:", error);
  }
}

export function getVideoById(videoId: string): VideoHistoryItem | null {
  const history = getVideoHistory();
  return history.find((item) => item.id === videoId) || null;
}

