import { NextRequest, NextResponse } from "next/server";
import { generateThumbnail } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, time, width, height } = await request.json();

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Video URL gereklidir" },
        { status: 400 }
      );
    }

    // Generate thumbnail
    const thumbnailBlob = await generateThumbnail(
      videoUrl,
      time || 1,
      width || 320,
      height
    );

    // Convert blob to base64
    const arrayBuffer = await thumbnailBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({
      success: true,
      thumbnailUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in generate-thumbnail API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Thumbnail oluşturulamadı",
      },
      { status: 500 }
    );
  }
}
