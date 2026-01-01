import { NextRequest, NextResponse } from "next/server";
import { convertVideoFormat } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, format, quality } = await request.json();

    if (!videoUrl || !format) {
      return NextResponse.json(
        { success: false, error: "Video URL ve format gereklidir" },
        { status: 400 }
      );
    }

    const validFormats = ["mp4", "webm", "gif", "mov"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz format. Desteklenen: mp4, webm, gif, mov" },
        { status: 400 }
      );
    }

    // Convert format
    const convertedBlob = await convertVideoFormat(
      videoUrl,
      format,
      quality || "medium"
    );

    // Convert blob to base64 data URL
    const arrayBuffer = await convertedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    const mimeTypes: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      gif: "image/gif",
      mov: "video/quicktime",
    };
    
    const dataUrl = `data:${mimeTypes[format] || "video/mp4"};base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in convert-video-format API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video formatı dönüştürülemedi",
      },
      { status: 500 }
    );
  }
}
