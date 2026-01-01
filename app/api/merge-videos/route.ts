import { NextRequest, NextResponse } from "next/server";
import { mergeVideos } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrls } = await request.json();

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length < 2) {
      return NextResponse.json(
        { success: false, error: "En az 2 video URL gereklidir" },
        { status: 400 }
      );
    }

    // Merge videos
    const mergedBlob = await mergeVideos(videoUrls);

    // Convert blob to base64 data URL
    const arrayBuffer = await mergedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in merge-videos API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Videolar birleştirilemedi",
      },
      { status: 500 }
    );
  }
}
