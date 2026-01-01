import { NextRequest, NextResponse } from "next/server";
import { applyColorCorrection } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, options } = await request.json();

    if (!videoUrl || !options) {
      return NextResponse.json(
        { success: false, error: "Video URL ve renk düzeltme seçenekleri gereklidir" },
        { status: 400 }
      );
    }

    // Validate options
    const validOptions = [
      "brightness",
      "contrast",
      "saturation",
      "exposure",
      "temperature",
      "tint",
      "shadows",
      "highlights",
      "gamma",
    ];

    const filteredOptions: any = {};
    for (const key of validOptions) {
      if (options[key] !== undefined) {
        const value = Number(options[key]);
        if (!isNaN(value) && value >= -100 && value <= 100) {
          filteredOptions[key] = value;
        }
      }
    }

    // Apply color correction
    const correctedBlob = await applyColorCorrection(videoUrl, filteredOptions);

    // Convert blob to base64 data URL
    const arrayBuffer = await correctedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({
      success: true,
      videoUrl: dataUrl,
    });
  } catch (error: any) {
    logger.error("Error in color-correction API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Renk düzeltmesi uygulanamadı",
      },
      { status: 500 }
    );
  }
}
