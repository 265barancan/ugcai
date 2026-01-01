import { NextRequest, NextResponse } from "next/server";
import { generatePoseVariation } from "@/lib/huggingface";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { sourceImageUrl, prompt, options } = await request.json();

    if (!sourceImageUrl) {
      return NextResponse.json(
        { success: false, error: "Kaynak görsel URL'si gereklidir" },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt gereklidir" },
        { status: 400 }
      );
    }

    // Generate pose variation
    const imageUrl = await generatePoseVariation(sourceImageUrl, prompt, options);

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error: any) {
    logger.error("Error in generate-pose-variation API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Poz varyasyonu oluşturulamadı",
      },
      { status: 500 }
    );
  }
}

