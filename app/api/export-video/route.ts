import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { exportVideoServer, isFFmpegAvailable } from "@/lib/serverFfmpeg";
import { ExportFormat, ExportQuality } from "@/types";

/**
 * Video export API endpoint
 * 
 * Attempts to use server-side FFmpeg if available.
 * If not available, returns a message suggesting client-side export.
 */

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, format, quality, frameRate, width, height } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Video URL is required" },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats: ExportFormat[] = ["mp4", "webm", "gif"];
    if (format && !validFormats.includes(format)) {
      return NextResponse.json(
        { success: false, error: `Invalid format. Must be one of: ${validFormats.join(", ")}` },
        { status: 400 }
      );
    }

    logger.log("Video export requested:", {
      videoUrl,
      format: format || "mp4",
      quality: quality || "medium",
      frameRate,
      width,
      height,
    });

    // Check if server-side FFmpeg is available
    const available = await isFFmpegAvailable();
    
    if (!available) {
      // Return message suggesting client-side export
      return NextResponse.json({
        success: false,
        error: "Server-side FFmpeg is not available. Please use client-side export (already implemented in VideoExporter component).",
        useClientSide: true,
        note: "The VideoExporter component uses client-side FFmpeg which works without server configuration.",
      });
    }

    try {
      // Use server-side FFmpeg
      let progress = 0;
      const exportedBuffer = await exportVideoServer(
        videoUrl,
        {
          format: (format || "mp4") as "mp4" | "webm" | "gif",
          quality: (quality || "medium") as "low" | "medium" | "high",
          frameRate: frameRate || undefined,
          width: width || undefined,
          height: height || undefined,
        },
        (p) => {
          progress = p;
        }
      );

      // Determine MIME type based on format
      const mimeTypes: Record<ExportFormat, string> = {
        mp4: "video/mp4",
        webm: "video/webm",
        gif: "image/gif",
      };
      const mimeType = mimeTypes[(format || "mp4") as ExportFormat];

      // Convert buffer to base64 for response
      const base64Video = exportedBuffer.toString("base64");

      logger.log("Video exported successfully on server");

      return NextResponse.json({
        success: true,
        exportedVideo: `data:${mimeType};base64,${base64Video}`,
        progress: 100,
        format: format || "mp4",
        note: "Video was exported using server-side FFmpeg.",
      });
    } catch (serverError: any) {
      logger.error("Server-side export failed:", serverError);
      
      // Fallback: suggest client-side
      return NextResponse.json({
        success: false,
        error: `Server-side export failed: ${serverError.message}. Please use client-side export.`,
        useClientSide: true,
        note: "The VideoExporter component uses client-side FFmpeg which works without server configuration.",
      });
    }
  } catch (error: any) {
    logger.error("Error in export-video API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video export edilemedi",
      },
      { status: 500 }
    );
  }
}

