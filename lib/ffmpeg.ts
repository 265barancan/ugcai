/**
 * FFmpeg utility for video processing
 * Uses @ffmpeg/ffmpeg for client-side video manipulation
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { logger } from "./logger";

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;
let isLoading = false;

/**
 * Initialize FFmpeg instance
 */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (ffmpegInstance && isLoaded) {
      return ffmpegInstance;
    }
  }

  isLoading = true;

  try {
    const ffmpeg = new FFmpeg();
    
    // Set up logging
    ffmpeg.on("log", ({ message }) => {
      logger.debug("FFmpeg:", message);
    });

    // Load FFmpeg
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegInstance = ffmpeg;
    isLoaded = true;
    isLoading = false;

    logger.log("FFmpeg loaded successfully");
    return ffmpeg;
  } catch (error) {
    isLoading = false;
    logger.error("Error loading FFmpeg:", error);
    throw error;
  }
}

/**
 * Export video with different format, quality, and frame rate
 */
export async function exportVideo(
  videoUrl: string,
  options: {
    format: "mp4" | "webm" | "gif";
    quality?: "low" | "medium" | "high";
    frameRate?: number;
    width?: number;
    height?: number;
  },
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    // Set up progress callback
    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = `output.${options.format}`;

    // Download video file
    logger.log("Downloading video...");
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Build FFmpeg command
    const args: string[] = ["-i", inputFileName];

    // Video codec and quality settings
    if (options.format === "mp4") {
      args.push("-c:v", "libx264");
      args.push("-c:a", "aac");
      
      // Quality settings (CRF: lower = higher quality)
      const crfMap = { low: "28", medium: "23", high: "18" };
      args.push("-crf", crfMap[options.quality || "medium"]);
      args.push("-preset", "medium");
    } else if (options.format === "webm") {
      args.push("-c:v", "libvpx-vp9");
      args.push("-c:a", "libopus");
      
      // Quality settings for VP9
      const qualityMap = { low: "40", medium: "30", high: "20" };
      args.push("-crf", qualityMap[options.quality || "medium"]);
    } else if (options.format === "gif") {
      // For GIF, we need to use palette
      const paletteFileName = "palette.png";
      await ffmpeg.exec([
        "-i", inputFileName,
        "-vf", "fps=10,scale=320:-1:flags=lanczos,palettegen",
        paletteFileName,
      ]);
      
      args.push("-i", paletteFileName);
      args.push("-filter_complex", "fps=10,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse");
    }

    // Frame rate
    if (options.frameRate) {
      args.push("-r", options.frameRate.toString());
    }

    // Resolution
    if (options.width && options.height) {
      args.push("-vf", `scale=${options.width}:${options.height}`);
    } else if (options.width) {
      args.push("-vf", `scale=${options.width}:-1`);
    } else if (options.height) {
      args.push("-vf", `scale=-1:${options.height}`);
    }

    args.push(outputFileName);

    // Execute FFmpeg
    logger.log(`Exporting video as ${options.format}...`);
    await ffmpeg.exec(args);

    // Read output file
    const data = await ffmpeg.readFile(outputFileName);
    // Convert FileData to Uint8Array for Blob
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const mimeType = 
      options.format === "mp4" ? "video/mp4" :
      options.format === "webm" ? "video/webm" :
      "image/gif";
    const blob = new Blob([uint8Array], { type: mimeType });

    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    if (options.format === "gif") {
      try {
        await ffmpeg.deleteFile("palette.png");
      } catch (e) {
        // Ignore if palette file doesn't exist
      }
    }

    logger.log("Video exported successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error exporting video:", error);
    throw new Error(`Video export hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

/**
 * Get video metadata (duration, resolution, etc.)
 */
export async function getVideoMetadata(videoUrl: string): Promise<{
  duration: number;
  width: number;
  height: number;
  format: string;
}> {
  try {
    const ffmpeg = await getFFmpeg();
    const inputFileName = "input.mp4";

    // Download video file
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Use ffprobe to get metadata (if available)
    // For now, we'll use a simpler approach with video element
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = videoUrl;
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          format: "mp4", // Default
        });
      };
      
      video.onerror = () => {
        reject(new Error("Video metadata alınamadı"));
      };
    });
  } catch (error: any) {
    logger.error("Error getting video metadata:", error);
    throw new Error(`Video metadata hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

/**
 * Generate thumbnail from video
 * @param videoUrl - URL of the video
 * @param time - Time in seconds to capture thumbnail (default: 1 second)
 * @param width - Thumbnail width (default: 320)
 * @param height - Thumbnail height (default: auto, maintains aspect ratio)
 * @returns Blob containing the thumbnail image
 */
export async function generateThumbnail(
  videoUrl: string,
  time: number = 1,
  width: number = 320,
  height?: number
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    const inputFileName = "input.mp4";
    const outputFileName = "thumbnail.jpg";

    // Download video file
    logger.log("Downloading video for thumbnail generation...");
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Build FFmpeg command for thumbnail extraction
    const args: string[] = [
      "-i", inputFileName,
      "-ss", time.toString(), // Seek to specific time
      "-vframes", "1", // Extract only 1 frame
      "-vf", `scale=${width}${height ? `:${height}` : ":-1"}`, // Scale image
      "-q:v", "2", // High quality JPEG
      outputFileName,
    ];

    logger.log(`Generating thumbnail at ${time}s...`);
    await ffmpeg.exec(args);

    // Read output file
    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "image/jpeg" });

    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Thumbnail generated successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error generating thumbnail:", error);
    throw error;
  }
}

/**
 * Generate multiple thumbnails from video (for preview grid)
 * @param videoUrl - URL of the video
 * @param count - Number of thumbnails to generate (default: 4)
 * @param width - Thumbnail width (default: 160)
 * @returns Array of Blobs containing thumbnails
 */
export async function generateThumbnails(
  videoUrl: string,
  count: number = 4,
  width: number = 160
): Promise<Blob[]> {
  try {
    const ffmpeg = await getFFmpeg();

    const inputFileName = "input.mp4";

    // Download video file
    logger.log("Downloading video for thumbnail generation...");
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Get video duration first (simplified - assume 10 seconds if we can't get it)
    // For now, we'll generate thumbnails at evenly spaced intervals
    const duration = 10; // Default duration, could be improved by reading video metadata
    const interval = duration / (count + 1);

    const thumbnails: Blob[] = [];

    // Generate thumbnails at different times
    for (let i = 1; i <= count; i++) {
      const time = interval * i;
      const outputFileName = `thumb_${i.toString().padStart(2, "0")}.jpg`;

      const args: string[] = [
        "-i", inputFileName,
        "-ss", time.toString(),
        "-vframes", "1",
        "-vf", `scale=${width}:-1`,
        "-q:v", "2",
        outputFileName,
      ];

      await ffmpeg.exec(args);

      // Read and store thumbnail
      const data = await ffmpeg.readFile(outputFileName);
      const uint8Array = data instanceof Uint8Array 
        ? data 
        : new Uint8Array(data as any);
      const blob = new Blob([uint8Array], { type: "image/jpeg" });
      thumbnails.push(blob);

      // Clean up this thumbnail file
      await ffmpeg.deleteFile(outputFileName);
    }

    // Clean up input file
    await ffmpeg.deleteFile(inputFileName);

    logger.log(`Generated ${count} thumbnails successfully`);
    return thumbnails;
  } catch (error: any) {
    logger.error("Error generating thumbnails:", error);
    throw error;
  }
}

/**
 * Apply video filter/effect
 * @param videoUrl - URL of the video
 * @param filter - Filter type (brightness, contrast, saturation, blur, sharpen, vintage, etc.)
 * @param intensity - Filter intensity (0-100)
 * @returns Blob containing the filtered video
 */
export async function applyVideoFilter(
  videoUrl: string,
  filter: "brightness" | "contrast" | "saturation" | "blur" | "sharpen" | "vintage" | "blackwhite" | "sepia",
  intensity: number = 50,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Build filter based on type
    let filterString = "";
    const intensityValue = intensity / 100; // Convert 0-100 to 0-1

    switch (filter) {
      case "brightness":
        filterString = `eq=brightness=${0.5 + intensityValue * 0.5}`; // 0.5 to 1.0
        break;
      case "contrast":
        filterString = `eq=contrast=${0.5 + intensityValue * 1.5}`; // 0.5 to 2.0
        break;
      case "saturation":
        filterString = `eq=saturation=${intensityValue * 2}`; // 0 to 2
        break;
      case "blur":
        filterString = `boxblur=${intensityValue * 10}:${intensityValue * 10}`;
        break;
      case "sharpen":
        filterString = `unsharp=5:5:${intensityValue * 2}:5:5:${intensityValue * 0.3}`;
        break;
      case "vintage":
        filterString = `curves=vintage,eq=saturation=${0.5 + intensityValue * 0.5}`;
        break;
      case "blackwhite":
        filterString = `hue=s=0`;
        break;
      case "sepia":
        filterString = `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
        break;
    }

    logger.log(`Applying ${filter} filter with intensity ${intensity}%...`);
    
    await ffmpeg.exec([
      "-i", inputFileName,
      "-vf", filterString,
      "-c:a", "copy", // Copy audio without re-encoding
      outputFileName,
    ]);

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Video filter applied successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error applying video filter:", error);
    throw error;
  }
}

/**
 * Change video playback speed
 * @param videoUrl - URL of the video
 * @param speed - Speed multiplier (0.5 = half speed, 2.0 = double speed)
 * @returns Blob containing the speed-adjusted video
 */
export async function changeVideoSpeed(
  videoUrl: string,
  speed: number, // 0.25 to 4.0
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Clamp speed between 0.25 and 4.0
    const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));

    logger.log(`Changing video speed to ${clampedSpeed}x...`);
    
    await ffmpeg.exec([
      "-i", inputFileName,
      "-filter_complex", `[0:v]setpts=PTS/${clampedSpeed}[v];[0:a]atempo=${clampedSpeed}[a]`,
      "-map", "[v]",
      "-map", "[a]",
      "-c:v", "libx264",
      "-c:a", "aac",
      "-preset", "fast",
      "-crf", "23",
      outputFileName,
    ]);

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Video speed changed successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error changing video speed:", error);
    throw error;
  }
}

/**
 * Merge/concatenate multiple videos
 * @param videoUrls - Array of video URLs to merge
 * @param transitions - Optional transition effects between videos
 * @returns Blob containing the merged video
 */
export async function mergeVideos(
  videoUrls: string[],
  transitions?: Array<{ type: "fade" | "dissolve" | "slide" | "none"; duration?: number }>,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    if (videoUrls.length < 2) {
      throw new Error("En az 2 video gereklidir");
    }

    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    // Download all videos
    const inputFiles: string[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const fileName = `input_${i}.mp4`;
      await ffmpeg.writeFile(fileName, await fetchFile(videoUrls[i]));
      inputFiles.push(fileName);
    }

    const outputFileName = "output.mp4";

    // Build concat filter
    // For simple concatenation without transitions
    // FFmpeg concat format requires file paths
    const concatList = inputFiles.map((file) => `file '${file}'`).join('\n');
    await ffmpeg.writeFile("concat.txt", concatList);

    logger.log(`Merging ${videoUrls.length} videos...`);
    
    try {
      // Try concat demuxer first (fast, no re-encoding)
      await ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c", "copy", // Copy streams without re-encoding (faster)
        outputFileName,
      ]);
    } catch (error) {
      // If copy fails (codec mismatch, etc.), use re-encoding
      logger.log("Copy failed, using re-encoding for merge...");
      await ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "fast",
        "-crf", "23",
        outputFileName,
      ]);
    }

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    // Clean up
    for (const file of inputFiles) {
      await ffmpeg.deleteFile(file);
    }
    await ffmpeg.deleteFile("concat.txt");
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Videos merged successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error merging videos:", error);
    throw error;
  }
}

/**
 * Trim video (cut start and/or end)
 * @param videoUrl - URL of the video
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds (optional, if not provided, trims to end)
 * @returns Blob containing the trimmed video
 */
export async function trimVideo(
  videoUrl: string,
  startTime: number,
  endTime?: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    const duration = endTime ? (endTime - startTime) : undefined;

    logger.log(`Trimming video from ${startTime}s${endTime ? ` to ${endTime}s` : " to end"}...`);
    
    const args: string[] = [
      "-i", inputFileName,
      "-ss", startTime.toString(),
    ];

    if (duration) {
      args.push("-t", duration.toString());
    }

    args.push(
      "-c", "copy", // Copy streams without re-encoding (faster)
      outputFileName,
    );

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Video trimmed successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error trimming video:", error);
    throw error;
  }
}

/**
 * Crop video
 * @param videoUrl - URL of the video
 * @param x - X position of crop (default: 0)
 * @param y - Y position of crop (default: 0)
 * @param width - Crop width
 * @param height - Crop height
 * @returns Blob containing the cropped video
 */
export async function cropVideo(
  videoUrl: string,
  width: number,
  height: number,
  x: number = 0,
  y: number = 0,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    logger.log(`Cropping video to ${width}x${height} at (${x}, ${y})...`);
    
    await ffmpeg.exec([
      "-i", inputFileName,
      "-vf", `crop=${width}:${height}:${x}:${y}`,
      "-c:a", "copy", // Copy audio
      outputFileName,
    ]);

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Video cropped successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error cropping video:", error);
    throw error;
  }
}

/**
 * Rotate video
 * @param videoUrl - URL of the video
 * @param angle - Rotation angle in degrees (90, 180, 270)
 * @returns Blob containing the rotated video
 */
export async function rotateVideo(
  videoUrl: string,
  angle: 90 | 180 | 270,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // FFmpeg rotation filter
    const rotationMap: Record<number, string> = {
      90: "transpose=1", // 90° clockwise
      180: "transpose=1,transpose=1", // 180°
      270: "transpose=2", // 90° counter-clockwise (270° clockwise)
    };

    logger.log(`Rotating video ${angle}°...`);
    
    await ffmpeg.exec([
      "-i", inputFileName,
      "-vf", rotationMap[angle],
      "-c:a", "copy", // Copy audio
      outputFileName,
    ]);

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Video rotated successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error rotating video:", error);
    throw error;
  }
}

/**
 * Convert video format
 * @param videoUrl - URL of the video
 * @param format - Target format (mp4, webm, gif, mov)
 * @param quality - Quality preset (low, medium, high)
 * @returns Blob containing the converted video
 */
export async function convertVideoFormat(
  videoUrl: string,
  format: "mp4" | "webm" | "gif" | "mov",
  quality: "low" | "medium" | "high" = "medium",
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = `output.${format}`;

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Quality presets
    const qualitySettings: Record<string, { crf: string; preset: string }> = {
      low: { crf: "28", preset: "fast" },
      medium: { crf: "23", preset: "medium" },
      high: { crf: "18", preset: "slow" },
    };

    const settings = qualitySettings[quality];

    logger.log(`Converting video to ${format.toUpperCase()} (${quality} quality)...`);
    
    const args: string[] = ["-i", inputFileName];

    if (format === "gif") {
      // GIF conversion requires palette
      await ffmpeg.exec([
        "-i", inputFileName,
        "-vf", "fps=10,scale=320:-1:flags=lanczos,palettegen",
        "palette.png",
      ]);

      await ffmpeg.exec([
        "-i", inputFileName,
        "-i", "palette.png",
        "-filter_complex", "fps=10,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse",
        outputFileName,
      ]);

      await ffmpeg.deleteFile("palette.png");
    } else if (format === "webm") {
      args.push(
        "-c:v", "libvpx-vp9",
        "-crf", settings.crf,
        "-b:v", "0",
        "-c:a", "libopus",
        outputFileName,
      );
      await ffmpeg.exec(args);
    } else if (format === "mov") {
      args.push(
        "-c:v", "libx264",
        "-crf", settings.crf,
        "-preset", settings.preset,
        "-c:a", "aac",
        outputFileName,
      );
      await ffmpeg.exec(args);
    } else {
      // MP4
      args.push(
        "-c:v", "libx264",
        "-crf", settings.crf,
        "-preset", settings.preset,
        "-c:a", "aac",
        outputFileName,
      );
      await ffmpeg.exec(args);
    }

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    
    const mimeTypes: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      gif: "image/gif",
      mov: "video/quicktime",
    };
    
    const blob = new Blob([uint8Array], { type: mimeTypes[format] || "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log(`Video converted to ${format.toUpperCase()} successfully`);
    return blob;
  } catch (error: any) {
    logger.error("Error converting video format:", error);
    throw error;
  }
}

/**
 * Compress/optimize video
 * @param videoUrl - URL of the video
 * @param quality - Compression quality (low, medium, high)
 * @param targetSizeMB - Target file size in MB (optional)
 * @returns Blob containing the compressed video
 */
export async function compressVideo(
  videoUrl: string,
  quality: "low" | "medium" | "high" = "medium",
  targetSizeMB?: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Quality presets
    const qualitySettings: Record<string, { crf: string; preset: string; scale?: string }> = {
      low: { crf: "32", preset: "fast", scale: "1280:720" },
      medium: { crf: "28", preset: "medium", scale: "1920:1080" },
      high: { crf: "23", preset: "slow" },
    };

    const settings = qualitySettings[quality];

    logger.log(`Compressing video (${quality} quality)...`);
    
    const args: string[] = [
      "-i", inputFileName,
      "-c:v", "libx264",
      "-crf", settings.crf,
      "-preset", settings.preset,
      "-c:a", "aac",
      "-b:a", "128k", // Audio bitrate
    ];

    if (settings.scale) {
      args.push("-vf", `scale=${settings.scale}`);
    }

    if (targetSizeMB) {
      // Calculate target bitrate based on duration (rough estimate)
      // This is a simplified approach
      args.push("-b:v", `${Math.floor(targetSizeMB * 8 * 1000 / 60)}k`); // Rough estimate
    }

    args.push(outputFileName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Video compressed successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error compressing video:", error);
    throw error;
  }
}

/**
 * Apply color correction/grading to video
 * @param videoUrl - URL of the video
 * @param options - Color correction options
 * @returns Blob containing the color-corrected video
 */
export async function applyColorCorrection(
  videoUrl: string,
  options: {
    brightness?: number; // -100 to 100
    contrast?: number; // -100 to 100
    saturation?: number; // -100 to 100
    exposure?: number; // -100 to 100
    temperature?: number; // -100 (cool/blue) to 100 (warm/orange)
    tint?: number; // -100 (green) to 100 (magenta)
    shadows?: number; // -100 to 100
    highlights?: number; // -100 to 100
    gamma?: number; // 0.1 to 3.0
  },
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

    // Build color correction filter
    const filters: string[] = [];

    // Brightness: -1.0 to 1.0
    if (options.brightness !== undefined) {
      const value = options.brightness / 100; // Convert -100 to 100 to -1.0 to 1.0
      filters.push(`eq=brightness=${0.5 + value * 0.5}`);
    }

    // Contrast: 0.0 to 2.0
    if (options.contrast !== undefined) {
      const value = (options.contrast + 100) / 100; // Convert -100 to 100 to 0.0 to 2.0
      filters.push(`eq=contrast=${value}`);
    }

    // Saturation: 0.0 to 2.0
    if (options.saturation !== undefined) {
      const value = (options.saturation + 100) / 100; // Convert -100 to 100 to 0.0 to 2.0
      filters.push(`eq=saturation=${value}`);
    }

    // Exposure: -3.0 to 3.0
    if (options.exposure !== undefined) {
      const value = (options.exposure / 100) * 3; // Convert -100 to 100 to -3.0 to 3.0
      filters.push(`eq=gamma=${1 + value}`);
    }

    // Temperature (Color temperature): -100 to 100
    if (options.temperature !== undefined) {
      // Temperature adjustment using colorbalance
      const tempValue = options.temperature / 100;
      filters.push(`colorbalance=rs=${tempValue * 0.3}:gs=${-tempValue * 0.1}:bs=${-tempValue * 0.3}`);
    }

    // Tint: -100 to 100
    if (options.tint !== undefined) {
      const tintValue = options.tint / 100;
      filters.push(`colorbalance=rm=${tintValue * 0.2}:gm=${-tintValue * 0.2}:bm=${tintValue * 0.2}`);
    }

    // Shadows: -100 to 100
    if (options.shadows !== undefined) {
      const shadowValue = options.shadows / 100;
      filters.push(`curves=shadow=${shadowValue * 0.5}`);
    }

    // Highlights: -100 to 100
    if (options.highlights !== undefined) {
      const highlightValue = options.highlights / 100;
      filters.push(`curves=highlight=${highlightValue * 0.5}`);
    }

    // Gamma: 0.1 to 3.0
    if (options.gamma !== undefined) {
      const gammaValue = 0.1 + (options.gamma / 100) * 2.9; // Convert 0-100 to 0.1-3.0
      filters.push(`eq=gamma=${gammaValue}`);
    }

    // Combine all filters
    const filterString = filters.length > 0 ? filters.join(",") : "null";

    logger.log("Applying color correction...");
    
    await ffmpeg.exec([
      "-i", inputFileName,
      "-vf", filterString,
      "-c:a", "copy", // Copy audio without re-encoding
      outputFileName,
    ]);

    const data = await ffmpeg.readFile(outputFileName);
    const uint8Array = data instanceof Uint8Array 
      ? data 
      : new Uint8Array(data as any);
    const blob = new Blob([uint8Array], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    logger.log("Color correction applied successfully");
    return blob;
  } catch (error: any) {
    logger.error("Error applying color correction:", error);
    throw error;
  }
}

