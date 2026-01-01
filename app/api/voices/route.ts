import { NextRequest, NextResponse } from "next/server";
import { getVoices } from "@/lib/elevenlabs";
import { getEdgeVoices } from "@/lib/edgetts";
import { getGoogleVoices } from "@/lib/googleTTS";
import { getAzureVoices } from "@/lib/azureTTS";
import { TTSProvider, Voice } from "@/types";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = (searchParams.get("provider") || "elevenlabs") as TTSProvider;

    let voices: Voice[] = [];

    switch (provider) {
      case "elevenlabs":
        voices = await getVoices();
        break;
      case "edgetts":
        const edgeVoices = await getEdgeVoices();
        voices = edgeVoices.map((voice) => ({
          voice_id: voice.ShortName,
          name: voice.FriendlyName || voice.Name,
          description: `${voice.Gender} - ${voice.Locale}`,
          category: voice.Status === "GA" ? "premade" : "preview",
          labels: {
            gender: voice.Gender,
            language: voice.Locale,
          },
        }));
        break;
      case "google":
        // Get all languages, not just Turkish
        const allGoogleVoices = await getGoogleVoices(); // No language code = all voices
        voices = allGoogleVoices.map((voice: any) => ({
          voice_id: voice.name,
          name: `${voice.name} (${voice.ssmlGender})`,
          description: `${voice.ssmlGender} - ${voice.languageCodes[0]}`,
          category: voice.name.includes("Wavenet") ? "premium" : "standard",
          labels: {
            gender: voice.ssmlGender,
            language: voice.languageCodes[0],
          },
        }));
        break;
      case "azure":
        // Get all languages, not just Turkish
        const allAzureVoices = await getAzureVoices(); // No locale = all voices
        voices = allAzureVoices.map((voice: any) => ({
          voice_id: voice.ShortName,
          name: voice.DisplayName || voice.Name,
          description: `${voice.Gender} - ${voice.Locale}`,
          category: voice.Status === "GA" ? "premade" : "preview",
          labels: {
            gender: voice.Gender,
            language: voice.Locale,
          },
        }));
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid TTS provider" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      voices: voices,
    });
  } catch (error: any) {
    logger.error("Error in voices API:", error);
    logger.error("Error stack:", error.stack);
    
    // Return a more detailed error message
    const errorMessage = error?.message || "Failed to fetch voices";
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        voices: [],
      },
      { status: 500 }
    );
  }
}

