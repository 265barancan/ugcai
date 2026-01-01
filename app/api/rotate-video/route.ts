import { NextRequest, NextResponse } from "next/server";
import { rotateVideo } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, angle } = await request.json();

    if (!videoUrl || !angle) {
      return NextResponse.json(
        { success: false, error: "Video URL ve açı gereklidir" },
        { status: 400 }
      );
    }

    if (![90, 180, 270].includes(angle)) {
      return NextResponse.json(
        { success: false, error: "Açı 90, 180 veya 270 olmalıdır" },
        { status: 400 }
      );
    }

    // Rotate video
    const rotatedBlob = await rotateVideo(videoUrl, angle);

    // Convert blob to base64 data URL
    const arrayBuffer = await rotatedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in rotate-video API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video döndürülemedi",
      },
      { status: 500 }
    );
  }
}
