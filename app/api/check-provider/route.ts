import { NextRequest, NextResponse } from "next/server";
import { VideoProvider, TTSProvider } from "@/types";
import { isProviderAvailable } from "@/lib/videoProviders";
import { isTTSProviderAvailable } from "@/lib/ttsProviders";
import { logger } from "@/lib/logger";

/**
 * Check if a provider (video or TTS) is available (has API key configured)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get("provider");
    const type = searchParams.get("type"); // "video" or "tts"

    if (!provider || !type) {
      return NextResponse.json(
        { success: false, error: "Provider and type are required" },
        { status: 400 }
      );
    }

    let isAvailable = false;

    if (type === "video") {
      isAvailable = isProviderAvailable(provider as VideoProvider);
    } else if (type === "tts") {
      isAvailable = isTTSProviderAvailable(provider as TTSProvider);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'video' or 'tts'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      available: isAvailable,
      provider,
      type,
    });
  } catch (error: any) {
    logger.error("Error checking provider availability:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check provider availability",
      },
      { status: 500 }
    );
  }
}

