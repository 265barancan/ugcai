import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/huggingface";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { prompt, options } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt gereklidir" },
        { status: 400 }
      );
    }

    // Generate image
    // Note: avatarImageUrl is passed in options for potential image-to-image generation
    const imageUrl = await generateImage(prompt || "", options);

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error: any) {
    logger.error("Error in generate-image API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Görsel oluşturulamadı",
      },
      { status: 500 }
    );
  }
}
