import { NextRequest, NextResponse } from "next/server";
import { compressVideo } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, quality, targetSizeMB } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Video URL gereklidir" },
        { status: 400 }
      );
    }

    const validQualities = ["low", "medium", "high"];
    if (quality && !validQualities.includes(quality)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz kalite seviyesi" },
        { status: 400 }
      );
    }

    // Compress video
    const compressedBlob = await compressVideo(
      videoUrl,
      quality || "medium",
      targetSizeMB
    );

    // Convert blob to base64 data URL
    const arrayBuffer = await compressedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in compress-video API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video sıkıştırılamadı",
      },
      { status: 500 }
    );
  }
}
