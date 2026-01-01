import { NextRequest, NextResponse } from "next/server";
import { applyVideoFilter } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, filter, intensity } = await request.json();

    if (!videoUrl || !filter) {
      return NextResponse.json(
        { success: false, error: "Video URL ve filtre tipi gereklidir" },
        { status: 400 }
      );
    }

    const validFilters = ["brightness", "contrast", "saturation", "blur", "sharpen", "vintage", "blackwhite", "sepia"];
    if (!validFilters.includes(filter)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz filtre tipi" },
        { status: 400 }
      );
    }

    // Apply filter
    const filteredBlob = await applyVideoFilter(
      videoUrl,
      filter,
      intensity || 50
    );

    // Convert blob to base64 data URL
    const arrayBuffer = await filteredBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in apply-video-filter API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Filtre uygulanamadı",
      },
      { status: 500 }
    );
  }
}
