import { NextRequest, NextResponse } from "next/server";
import { changeVideoSpeed } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, speed } = await request.json();

    if (!videoUrl || speed === undefined) {
      return NextResponse.json(
        { success: false, error: "Video URL ve hız değeri gereklidir" },
        { status: 400 }
      );
    }

    // Validate speed (0.25 to 4.0)
    const validSpeed = Math.max(0.25, Math.min(4.0, Number(speed)));
    if (isNaN(validSpeed)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz hız değeri (0.25-4.0 arası olmalı)" },
        { status: 400 }
      );
    }

    // Change speed
    const speedAdjustedBlob = await changeVideoSpeed(videoUrl, validSpeed);

    // Convert blob to base64 data URL
    const arrayBuffer = await speedAdjustedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in change-video-speed API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video hızı değiştirilemedi",
      },
      { status: 500 }
    );
  }
}
