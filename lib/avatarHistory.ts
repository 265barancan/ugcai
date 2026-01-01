/**
 * Avatar history management
 */

import { logger } from "./logger";

export interface SavedAvatar {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  createdAt: number;
  tags?: string[];
}

const STORAGE_KEY = "saved_avatars";
const MAX_AVATARS = 50;

export function saveAvatar(
  imageUrl: string,
  prompt: string,
  model: string,
  tags?: string[]
): SavedAvatar {
  const avatar: SavedAvatar = {
    id: `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    imageUrl,
    prompt,
    model,
    createdAt: Date.now(),
    tags: tags || [],
  };

  const avatars = getAllAvatars();
  avatars.unshift(avatar); // Add to beginning
  const limited = avatars.slice(0, MAX_AVATARS);
  saveAvatars(limited);

  return avatar;
}

export function getAllAvatars(): SavedAvatar[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const avatars = JSON.parse(stored) as SavedAvatar[];
    return avatars.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    logger.error("Error reading avatar history:", error);
    return [];
  }
}

export function getAvatarById(id: string): SavedAvatar | null {
  const avatars = getAllAvatars();
  return avatars.find((a) => a.id === id) || null;
}

export function deleteAvatar(id: string): boolean {
  const avatars = getAllAvatars();
  const filtered = avatars.filter((a) => a.id !== id);

  if (filtered.length === avatars.length) return false;

  saveAvatars(filtered);
  return true;
}

export function searchAvatars(query: string): SavedAvatar[] {
  const avatars = getAllAvatars();
  const lowerQuery = query.toLowerCase();
  
  return avatars.filter((avatar) =>
    avatar.prompt.toLowerCase().includes(lowerQuery) ||
    avatar.model.toLowerCase().includes(lowerQuery) ||
    avatar.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

function saveAvatars(avatars: SavedAvatar[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(avatars));
  } catch (error) {
    logger.error("Error saving avatar history:", error);
    if (error instanceof DOMException && error.code === 22) {
      // Storage full - try to reduce
      const reduced = avatars.slice(0, Math.floor(MAX_AVATARS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    }
  }
}
