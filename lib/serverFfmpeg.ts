/**
 * Server-side FFmpeg utility for video processing
 * Uses fluent-ffmpeg for server-side video manipulation
 * 
 * Note: This requires ffmpeg to be installed on the server.
 * If ffmpeg is not available, the client-side solution will be used as fallback.
 */

import ffmpeg from "fluent-ffmpeg";
import { logger } from "./logger";
import { Readable, PassThrough } from "stream";

/**
 * Check if ffmpeg is available on the server
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableEncoders((err, encoders) => {
      if (err) {
        logger.debug("FFmpeg not available on server:", err.message);
        resolve(false);
      } else {
        logger.debug("FFmpeg is available on server");
        resolve(true);
      }
    });
  });
}

/**
 * Download video from URL and return as buffer
 */
async function downloadVideo(videoUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    logger.error("Error downloading video:", error);
    throw new Error(`Video indirme hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

/**
 * Convert buffer to readable stream
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Trim video using server-side FFmpeg
 */
export async function trimVideoServer(
  videoUrl: string,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void
): Promise<Buffer> {
  try {
    // Check if ffmpeg is available
    const available = await isFFmpegAvailable();
    if (!available) {
      throw new Error("FFmpeg is not available on the server. Please use client-side trimming.");
    }

    // Download video
    logger.log("Downloading video for trimming...");
    const videoBuffer = await downloadVideo(videoUrl);
    const videoStream = bufferToStream(videoBuffer);

    // Calculate duration
    const duration = endTime - startTime;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();

      outputStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      outputStream.on("end", () => {
        logger.log("Video trimmed successfully");
        resolve(Buffer.concat(chunks));
      });

      outputStream.on("error", (err) => {
        logger.error("Stream error:", err);
        reject(new Error(`Video kesme hatası: ${err.message || "Bilinmeyen hata"}`));
      });

      const command = ffmpeg(videoStream)
        .seekInput(startTime)
        .duration(duration)
        .videoCodec("libx264")
        .audioCodec("aac")
        .format("mp4")
        .outputOptions([
          "-preset fast",
          "-crf 23",
          "-movflags frag_keyframe+empty_moov", // For streaming
        ])
        .on("start", (commandLine) => {
          logger.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          if (onProgress && progress.percent) {
            onProgress(progress.percent);
          }
        })
        .on("error", (err) => {
          logger.error("FFmpeg error:", err);
          reject(new Error(`Video kesme hatası: ${err.message || "Bilinmeyen hata"}`));
        });

      command.pipe(outputStream, { end: true });
    });
  } catch (error: any) {
    logger.error("Error trimming video on server:", error);
    throw error;
  }
}

/**
 * Export video with different format, quality, and frame rate using server-side FFmpeg
 */
export async function exportVideoServer(
  videoUrl: string,
  options: {
    format: "mp4" | "webm" | "gif";
    quality?: "low" | "medium" | "high";
    frameRate?: number;
    width?: number;
    height?: number;
  },
  onProgress?: (progress: number) => void
): Promise<Buffer> {
  try {
    // Check if ffmpeg is available
    const available = await isFFmpegAvailable();
    if (!available) {
      throw new Error("FFmpeg is not available on the server. Please use client-side export.");
    }

    // Download video
    logger.log("Downloading video for export...");
    const videoBuffer = await downloadVideo(videoUrl);
    const videoStream = bufferToStream(videoBuffer);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();

      outputStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      outputStream.on("end", () => {
        logger.log("Video exported successfully");
        resolve(Buffer.concat(chunks));
      });

      outputStream.on("error", (err) => {
        logger.error("Stream error:", err);
        reject(new Error(`Video export hatası: ${err.message || "Bilinmeyen hata"}`));
      });

      const command = ffmpeg(videoStream);

      // Set format
      command.format(options.format);

      // Set codec and quality based on format
      if (options.format === "mp4") {
        command.videoCodec("libx264").audioCodec("aac");
        const crfMap = { low: "28", medium: "23", high: "18" };
        command.outputOptions([`-crf ${crfMap[options.quality || "medium"]}`, "-preset medium"]);
      } else if (options.format === "webm") {
        command.videoCodec("libvpx-vp9").audioCodec("libopus");
        const qualityMap = { low: "40", medium: "30", high: "20" };
        command.outputOptions([`-crf ${qualityMap[options.quality || "medium"]}`]);
      } else if (options.format === "gif") {
        // For GIF, we need to use palette
        command
          .videoCodec("gif")
          .outputOptions([
            "-vf",
            `fps=${options.frameRate || 10},scale=${options.width || 320}:-1:flags=lanczos`,
          ]);
      }

      // Set frame rate
      if (options.frameRate) {
        command.fps(options.frameRate);
      }

      // Set resolution
      if (options.width && options.height) {
        command.size(`${options.width}x${options.height}`);
      } else if (options.width) {
        command.size(`${options.width}x?`);
      } else if (options.height) {
        command.size(`?x${options.height}`);
      }

      command
        .on("start", (commandLine) => {
          logger.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          if (onProgress && progress.percent) {
            onProgress(progress.percent);
          }
        })
        .on("error", (err) => {
          logger.error("FFmpeg error:", err);
          reject(new Error(`Video export hatası: ${err.message || "Bilinmeyen hata"}`));
        });

      command.pipe(outputStream, { end: true });
    });
  } catch (error: any) {
    logger.error("Error exporting video on server:", error);
    throw error;
  }
}

