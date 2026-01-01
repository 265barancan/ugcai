import { NextRequest, NextResponse } from "next/server";
import { generateAudio } from "@/lib/elevenlabs";
import { generateEdgeAudio } from "@/lib/edgetts";
import { generateGoogleAudio } from "@/lib/googleTTS";
import { generateAzureAudio } from "@/lib/azureTTS";
import { TTSProvider } from "@/types";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, provider = "elevenlabs" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    let audioBuffer: Buffer;

    switch (provider as TTSProvider) {
      case "elevenlabs":
        audioBuffer = await generateAudio(text, voiceId);
        break;
      case "edgetts":
        audioBuffer = await generateEdgeAudio(text, voiceId);
        break;
      case "google":
        audioBuffer = await generateGoogleAudio(text, voiceId);
        break;
      case "azure":
        audioBuffer = await generateAzureAudio(text, voiceId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid TTS provider" },
          { status: 400 }
        );
    }

    // Convert buffer to base64 for transmission
    const base64Audio = audioBuffer.toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
    });
  } catch (error: any) {
    logger.error("Error in generate-audio API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate audio",
      },
      { status: 500 }
    );
  }
}

