import { NextRequest, NextResponse } from "next/server";
import { trimVideo } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, startTime, endTime } = await request.json();

    if (!videoUrl || startTime === undefined) {
      return NextResponse.json(
        { success: false, error: "Video URL ve başlangıç zamanı gereklidir" },
        { status: 400 }
      );
    }

    if (startTime < 0) {
      return NextResponse.json(
        { success: false, error: "Başlangıç zamanı 0'dan küçük olamaz" },
        { status: 400 }
      );
    }

    if (endTime !== undefined && endTime <= startTime) {
      return NextResponse.json(
        { success: false, error: "Bitiş zamanı başlangıç zamanından büyük olmalıdır" },
        { status: 400 }
      );
    }

    // Trim video
    const trimmedBlob = await trimVideo(videoUrl, startTime, endTime);

    // Convert blob to base64 data URL
    const arrayBuffer = await trimmedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in trim-video API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video kırpılamadı",
      },
      { status: 500 }
    );
  }
}
