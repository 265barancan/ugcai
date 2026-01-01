/**
 * Video caching utilities using IndexedDB
 */

import { logger } from "./logger";

const DB_NAME = "video_cache_db";
const DB_VERSION = 1;
const STORE_NAME = "videos";

interface CachedVideo {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error("IndexedDB açılamadı:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: "url" });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Cache a video
 */
export async function cacheVideo(url: string, blob: Blob): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const cachedVideo: CachedVideo = {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cachedVideo);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    logger.log(`Video cached: ${url} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    logger.error("Error caching video:", error);
  }
}

/**
 * Get cached video
 */
export async function getCachedVideo(url: string): Promise<Blob | null> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<Blob | null>((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => {
        const result = request.result as CachedVideo | undefined;
        if (result) {
          // Check if cache is still valid (7 days)
          const maxAge = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - result.timestamp < maxAge) {
            resolve(result.blob);
          } else {
            // Cache expired, delete it
            deleteCachedVideo(url);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error("Error getting cached video:", error);
    return null;
  }
}

/**
 * Delete cached video
 */
export async function deleteCachedVideo(url: string): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(url);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error("Error deleting cached video:", error);
  }
}

/**
 * Clear all cached videos
 */
export async function clearVideoCache(): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    logger.log("Video cache cleared");
  } catch (error) {
    logger.error("Error clearing video cache:", error);
  }
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<number>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const videos = request.result as CachedVideo[];
        const totalSize = videos.reduce((sum, video) => sum + video.size, 0);
        resolve(totalSize);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error("Error getting cache size:", error);
    return 0;
  }
}

/**
 * Get cached video URL (creates object URL from blob)
 */
export async function getCachedVideoUrl(url: string): Promise<string | null> {
  const blob = await getCachedVideo(url);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return null;
}

/**
 * Fetch video with caching
 */
export async function fetchVideoWithCache(url: string): Promise<string> {
  // Try to get from cache first
  const cachedUrl = await getCachedVideoUrl(url);
  if (cachedUrl) {
    logger.log("Video loaded from cache:", url);
    return cachedUrl;
  }

  // Fetch and cache
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const blob = await response.blob();
    await cacheVideo(url, blob);
    
    const objectUrl = URL.createObjectURL(blob);
    logger.log("Video fetched and cached:", url);
    return objectUrl;
  } catch (error) {
    logger.error("Error fetching video:", error);
    throw error;
  }
}

