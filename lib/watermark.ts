/**
 * Watermark utilities for adding watermarks to videos
 */

import { WatermarkOptions } from "@/types";
import { logger } from "./logger";

/**
 * Apply watermark to video using Canvas and MediaRecorder API
 * Note: This creates a new video with watermark overlay
 */
export async function applyWatermarkToVideo(
  videoUrl: string,
  options: WatermarkOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = videoUrl;
    video.muted = true; // Required for autoplay

    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Canvas context alınamadı"));
        return;
      }

      // Create stream from canvas
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      mediaRecorder.onerror = (e) => {
        reject(new Error("Video kaydı sırasında hata oluştu"));
      };

      // Start recording
      mediaRecorder.start();

      // Draw frames with watermark
      const drawFrame = () => {
        if (video.ended || video.paused) {
          mediaRecorder.stop();
          return;
        }

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Apply watermark
        if (options.enabled) {
          drawWatermark(ctx, canvas.width, canvas.height, options);
        }

        requestAnimationFrame(drawFrame);
      };

      // Start playing and drawing
      video.currentTime = 0;
      video.play().then(() => {
        drawFrame();
      }).catch((err) => {
        reject(new Error("Video oynatılamadı: " + err.message));
      });

      // Stop when video ends
      video.onended = () => {
        mediaRecorder.stop();
      };
    };

    video.onerror = () => {
      reject(new Error("Video yüklenemedi"));
    };

    video.load();
  });
}

/**
 * Draw watermark on canvas
 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  videoWidth: number,
  videoHeight: number,
  options: WatermarkOptions
): void {
  ctx.save();
  ctx.globalAlpha = options.opacity;

  const { x, y, width, height } = calculateWatermarkPosition(
    videoWidth,
    videoHeight,
    options
  );

  if (options.type === "text" && options.text) {
    // Draw text watermark
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.font = `bold ${height}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw text with stroke for better visibility
    ctx.strokeText(options.text, x + width / 2, y + height / 2);
    ctx.fillText(options.text, x + width / 2, y + height / 2);
  } else if (options.type === "image" && options.imageUrl) {
    // Draw image watermark
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
    };
    img.onerror = () => {
      logger.error("Watermark image yüklenemedi");
    };
    img.src = options.imageUrl;
  }

  ctx.restore();
}

/**
 * Calculate watermark position and size
 */
function calculateWatermarkPosition(
  videoWidth: number,
  videoHeight: number,
  options: WatermarkOptions
): { x: number; y: number; width: number; height: number } {
  const size = (options.size / 100) * Math.min(videoWidth, videoHeight);
  const width = size;
  const height = size;

  let x = 0;
  let y = 0;

  switch (options.position) {
    case "top-left":
      x = options.margin;
      y = options.margin;
      break;
    case "top-right":
      x = videoWidth - width - options.margin;
      y = options.margin;
      break;
    case "bottom-left":
      x = options.margin;
      y = videoHeight - height - options.margin;
      break;
    case "bottom-right":
      x = videoWidth - width - options.margin;
      y = videoHeight - height - options.margin;
      break;
    case "center":
      x = (videoWidth - width) / 2;
      y = (videoHeight - height) / 2;
      break;
  }

  return { x, y, width, height };
}

/**
 * Create watermark preview (for single frame)
 */
export function createWatermarkPreview(
  videoUrl: string,
  options: WatermarkOptions,
  frameTime: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      video.currentTime = frameTime;

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context alınamadı"));
          return;
        }

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Apply watermark
        if (options.enabled) {
          drawWatermark(ctx, canvas.width, canvas.height, options);
        }

        // Convert to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      };
    };

    video.onerror = () => {
      reject(new Error("Video yüklenemedi"));
    };

    video.load();
  });
}

