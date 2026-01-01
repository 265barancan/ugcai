import { NextRequest, NextResponse } from "next/server";
import { generateAvatar, AvatarGenerationOptions } from "@/lib/huggingface";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { prompt, options } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Prompt gereklidir" },
        { status: 400 }
      );
    }

    // Check if Hugging Face API key is available (optional but recommended)
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    if (!apiKey) {
      // Still allow generation without API key (free tier)
      logger.warn("Hugging Face API key not found, using free tier");
    }

    const avatarOptions: AvatarGenerationOptions = options || {};

    const avatarImage = await generateAvatar(prompt.trim(), avatarOptions);

    return NextResponse.json({
      success: true,
      imageUrl: avatarImage,
    });
  } catch (error: any) {
    logger.error("Error in generate-avatar API:", error);
    
    // Handle rate limit errors with appropriate status code
    const isRateLimit = error?.status === 429 || 
                       error?.message?.includes("429") || 
                       error?.message?.includes("rate limit") ||
                       error?.message?.includes("throttled");
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Avatar oluşturulamadı",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
