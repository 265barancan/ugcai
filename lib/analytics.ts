/**
 * Analytics utilities for tracking video generation statistics
 */

import { VideoHistoryItem, AnalyticsData, VideoProvider } from "@/types";
import { getVideoHistory } from "./videoHistory";
import { getBatchJobs } from "./batchProcessor";
import { logger } from "./logger";

const STORAGE_KEY = "analytics_data";

export function calculateAnalytics(): AnalyticsData {
  try {
    const history = getVideoHistory();
    const batchJobs = getBatchJobs();

    // Calculate total videos
    const totalVideos = history.length;

    // Calculate total duration (estimate based on video settings)
    const totalDuration = history.reduce((sum, item) => {
      return sum + (item.settings?.duration || 8);
    }, 0);

    // Calculate total storage (estimate - actual storage would require video file sizes)
    // For now, we'll estimate based on duration and resolution
    const totalStorage = history.reduce((sum, item) => {
      const duration = item.settings?.duration || 8;
      const resolution = item.settings?.resolution || "1080p";
      
      // Rough estimates: 1080p ~ 1MB/sec, 720p ~ 0.5MB/sec, 4K ~ 3MB/sec
      let mbPerSecond = 1;
      if (resolution === "720p") mbPerSecond = 0.5;
      else if (resolution === "4K") mbPerSecond = 3;
      
      return sum + (duration * mbPerSecond * 1024 * 1024); // Convert to bytes
    }, 0);

    // Calculate videos by day (last 30 days)
    const last30Days: { date: string; videos: number; duration: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayVideos = history.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate.toISOString().split("T")[0] === dateStr;
      });
      
      last30Days.push({
        date: dateStr,
        videos: dayVideos.length,
        duration: dayVideos.reduce((sum, item) => sum + (item.settings?.duration || 8), 0),
      });
    }

    // Calculate videos by provider (from batch jobs and history)
    const providerCounts: { [key in VideoProvider]?: number } = {};
    
    // Count from batch jobs
    batchJobs.forEach((job) => {
      job.items.forEach((item) => {
        // Provider info would need to be stored in batch items
        // For now, we'll estimate based on default provider
      });
    });

    // For now, we'll set default provider counts
    const videosByProvider: { provider: VideoProvider; count: number }[] = [
      { provider: "replicate", count: Math.floor(totalVideos * 0.6) },
      { provider: "fal", count: Math.floor(totalVideos * 0.25) },
      { provider: "huggingface", count: Math.floor(totalVideos * 0.15) },
    ];

    // Calculate average generation time (estimate)
    // In a real app, you'd track actual generation times
    const averageGenerationTime = 45; // seconds (estimate)

    // Calculate success rate
    const failedVideos = batchJobs.reduce((sum, job) => sum + job.failedCount, 0);
    const successRate = totalVideos > 0 
      ? ((totalVideos - failedVideos) / totalVideos) * 100 
      : 100;

    // Calculate videos by day (for chart)
    const videosByDay = last30Days.map((day) => ({
      date: day.date,
      count: day.videos,
    }));

    return {
      totalVideos,
      totalDuration,
      totalStorage,
      videosByDay,
      videosByProvider,
      averageGenerationTime,
      successRate,
      last30Days,
    };
  } catch (error) {
    logger.error("Error calculating analytics:", error);
    return getDefaultAnalytics();
  }
}

function getDefaultAnalytics(): AnalyticsData {
  return {
    totalVideos: 0,
    totalDuration: 0,
    totalStorage: 0,
    videosByDay: [],
    videosByProvider: [],
    averageGenerationTime: 0,
    successRate: 100,
    last30Days: [],
  };
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}s ${minutes}d ${secs}sn`;
  } else if (minutes > 0) {
    return `${minutes}d ${secs}sn`;
  } else {
    return `${secs}sn`;
  }
}

export function formatStorage(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

