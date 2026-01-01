import { NextRequest, NextResponse } from "next/server";
import { cropVideo } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, x, y, width, height } = await request.json();

    if (!videoUrl || width === undefined || height === undefined) {
      return NextResponse.json(
        { success: false, error: "Video URL, genişlik ve yükseklik gereklidir" },
        { status: 400 }
      );
    }

    if (width <= 0 || height <= 0) {
      return NextResponse.json(
        { success: false, error: "Genişlik ve yükseklik 0'dan büyük olmalıdır" },
        { status: 400 }
      );
    }

    // Crop video
    const croppedBlob = await cropVideo(
      videoUrl,
      width,
      height,
      x || 0,
      y || 0
    );

    // Convert blob to base64 data URL
    const arrayBuffer = await croppedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in crop-video API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video kırpılamadı",
      },
      { status: 500 }
    );
  }
}
