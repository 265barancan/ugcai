import { NextRequest, NextResponse } from "next/server";
import { transcribeVideoWithHuggingFace } from "@/lib/transcription";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { audioBase64, provider, language } = await request.json();

    if (!audioBase64) {
      return NextResponse.json(
        { success: false, error: "Audio data gereklidir" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Transcribe audio
    const transcript = await transcribeVideoWithHuggingFace(
      audioBuffer,
      language || "tr"
    );

    return NextResponse.json({
      success: true,
      transcript,
    });
  } catch (error: any) {
    logger.error("Error in transcribe-video API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video transkript edilemedi",
      },
      { status: 500 }
    );
  }
}
