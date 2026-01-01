/**
 * Video collections/folders management
 */

import { VideoHistoryItem } from "@/types";
import { logger } from "./logger";

export interface VideoCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  videoIds: string[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "video_collections";
const MAX_COLLECTIONS = 20;

export function createCollection(
  name: string,
  description?: string,
  color?: string,
  icon?: string
): VideoCollection {
  const collection: VideoCollection = {
    id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    color: color || "purple",
    icon: icon || "📁",
    videoIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const collections = getAllCollections();
  collections.push(collection);
  saveCollections(collections);

  return collection;
}

export function getAllCollections(): VideoCollection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const collections = JSON.parse(stored) as VideoCollection[];
    return collections.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    logger.error("Error reading video collections:", error);
    return [];
  }
}

export function getCollectionById(id: string): VideoCollection | null {
  const collections = getAllCollections();
  return collections.find((c) => c.id === id) || null;
}

export function updateCollection(
  id: string,
  updates: Partial<Omit<VideoCollection, "id" | "createdAt">>
): boolean {
  const collections = getAllCollections();
  const index = collections.findIndex((c) => c.id === id);
  
  if (index === -1) return false;

  collections[index] = {
    ...collections[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveCollections(collections);
  return true;
}

export function deleteCollection(id: string): boolean {
  const collections = getAllCollections();
  const filtered = collections.filter((c) => c.id !== id);

  if (filtered.length === collections.length) return false;

  saveCollections(filtered);
  return true;
}

export function addVideoToCollection(collectionId: string, videoId: string): boolean {
  const collections = getAllCollections();
  const collection = collections.find((c) => c.id === collectionId);
  
  if (!collection) return false;

  if (!collection.videoIds.includes(videoId)) {
    collection.videoIds.push(videoId);
    collection.updatedAt = Date.now();
    saveCollections(collections);
  }

  return true;
}

export function removeVideoFromCollection(collectionId: string, videoId: string): boolean {
  const collections = getAllCollections();
  const collection = collections.find((c) => c.id === collectionId);
  
  if (!collection) return false;

  collection.videoIds = collection.videoIds.filter((id) => id !== videoId);
  collection.updatedAt = Date.now();
  saveCollections(collections);

  return true;
}

export function getVideosInCollection(collectionId: string, allVideos: VideoHistoryItem[]): VideoHistoryItem[] {
  const collection = getCollectionById(collectionId);
  if (!collection) return [];

  return allVideos.filter((video) => collection.videoIds.includes(video.id));
}

function saveCollections(collections: VideoCollection[]): void {
  try {
    // Limit collections
    const limited = collections.slice(0, MAX_COLLECTIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    logger.error("Error saving video collections:", error);
    if (error instanceof DOMException && error.code === 22) {
      // Storage full - try to reduce
      const reduced = collections.slice(0, Math.floor(MAX_COLLECTIONS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    }
  }
}
