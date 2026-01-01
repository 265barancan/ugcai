import { NextRequest, NextResponse } from "next/server";
import { generateAudio } from "@/lib/elevenlabs";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { voiceId, language } = await request.json();

    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json(
        { success: false, error: "Voice ID is required" },
        { status: 400 }
      );
    }

    // Preview text based on language
    const previewText = language === "tr" 
      ? "Merhaba, bu bir ses önizlemesidir. Bu sesi nasıl buldunuz?"
      : "Hello, this is a voice preview. How do you like this voice?";

    const audioBuffer = await generateAudio(previewText, voiceId);

    // Convert buffer to base64 for transmission
    const base64Audio = audioBuffer.toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
    });
  } catch (error: any) {
    logger.error("Error in preview-voice API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate preview",
      },
      { status: 500 }
    );
  }
}

