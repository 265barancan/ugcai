/**
 * Video export utilities
 * Note: Actual video conversion requires server-side processing (ffmpeg)
 * This file provides client-side utilities for preparing export requests
 */

import { ExportOptions, ExportFormat, ExportQuality, ExportFrameRate } from "@/types";
import { logger } from "./logger";

/**
 * Convert video to different format using server-side API
 */
export async function exportVideo(
  videoUrl: string,
  options: ExportOptions
): Promise<string> {
  try {
    const response = await fetch("/api/export-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl,
        ...options,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Video export edilemedi");
    }

    return data.exportUrl;
  } catch (error: any) {
    logger.error("Error exporting video:", error);
    throw error;
  }
}

/**
 * Get export file extension based on format
 */
export function getExportExtension(format: ExportFormat): string {
  return format;
}

/**
 * Get export MIME type based on format
 */
export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "gif":
      return "image/gif";
    default:
      return "video/mp4";
  }
}

/**
 * Get quality settings for export
 */
export function getQualitySettings(quality: ExportQuality, originalWidth?: number, originalHeight?: number): {
  width: number;
  height: number;
  bitrate?: string;
} {
  const aspectRatio = originalWidth && originalHeight ? originalWidth / originalHeight : 16 / 9;

  switch (quality) {
    case "low":
      return {
        width: 640,
        height: Math.round(640 / aspectRatio),
        bitrate: "1M",
      };
    case "medium":
      return {
        width: 1280,
        height: Math.round(1280 / aspectRatio),
        bitrate: "3M",
      };
    case "high":
      return {
        width: 1920,
        height: Math.round(1920 / aspectRatio),
        bitrate: "8M",
      };
    case "original":
      return {
        width: originalWidth || 1920,
        height: originalHeight || 1080,
      };
    default:
      return {
        width: 1280,
        height: Math.round(1280 / aspectRatio),
        bitrate: "3M",
      };
  }
}

/**
 * Download video with custom filename
 */
export function downloadVideo(url: string, filename: string): void {
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    logger.error("Error downloading video:", error);
    throw error;
  }
}

/**
 * Generate filename with format and quality
 */
export function generateExportFilename(
  baseName: string,
  format: ExportFormat,
  quality: ExportQuality
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${baseName}_${quality}_${timestamp}.${format}`;
}

