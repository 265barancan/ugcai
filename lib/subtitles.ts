/**
 * Subtitle/Caption generation and management
 */

import { logger } from "./logger";

export interface SubtitleOptions {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  position?: "bottom" | "top" | "center";
  alignment?: "left" | "center" | "right";
  outlineColor?: string;
  outlineWidth?: number;
}

export interface SubtitleEntry {
  start: number; // Start time in seconds
  end: number; // End time in seconds
  text: string; // Subtitle text
}

/**
 * Generate subtitles from text with automatic timing
 */
export function generateSubtitlesFromText(
  text: string,
  duration: number,
  wordsPerMinute: number = 150
): SubtitleEntry[] {
  const words = text.split(/\s+/);
  const totalWords = words.length;
  const wordsPerSecond = wordsPerMinute / 60;
  const totalDuration = duration;
  
  // Calculate how many words per subtitle (aim for 2-3 seconds per subtitle)
  const targetSubtitleDuration = 2.5; // seconds
  const wordsPerSubtitle = Math.ceil(wordsPerSecond * targetSubtitleDuration);
  
  const subtitles: SubtitleEntry[] = [];
  let currentTime = 0;
  
  for (let i = 0; i < totalWords; i += wordsPerSubtitle) {
    const subtitleWords = words.slice(i, i + wordsPerSubtitle);
    const subtitleText = subtitleWords.join(" ");
    const subtitleDuration = subtitleWords.length / wordsPerSecond;
    
    // Ensure we don't exceed video duration
    if (currentTime >= totalDuration) break;
    
    const endTime = Math.min(currentTime + subtitleDuration, totalDuration);
    
    subtitles.push({
      start: currentTime,
      end: endTime,
      text: subtitleText,
    });
    
    currentTime = endTime;
  }
  
  return subtitles;
}

/**
 * Convert subtitles to SRT format
 */
export function subtitlesToSRT(subtitles: SubtitleEntry[]): string {
  return subtitles
    .map((subtitle, index) => {
      const startTime = formatSRTTime(subtitle.start);
      const endTime = formatSRTTime(subtitle.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`;
    })
    .join("\n");
}

/**
 * Convert subtitles to VTT format
 */
export function subtitlesToVTT(subtitles: SubtitleEntry[]): string {
  let vtt = "WEBVTT\n\n";
  vtt += subtitles
    .map((subtitle) => {
      const startTime = formatVTTTime(subtitle.start);
      const endTime = formatVTTTime(subtitle.end);
      return `${startTime} --> ${endTime}\n${subtitle.text}\n`;
    })
    .join("\n\n");
  return vtt;
}

/**
 * Format time for SRT (00:00:00,000)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

/**
 * Format time for VTT (00:00:00.000)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

/**
 * Download subtitle file
 */
export function downloadSubtitleFile(
  content: string,
  filename: string,
  format: "srt" | "vtt"
): void {
  const blob = new Blob([content], { type: `text/${format}` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
