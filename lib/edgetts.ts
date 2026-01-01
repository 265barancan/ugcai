/**
 * Edge TTS (Microsoft Edge Text-to-Speech) integration
 * Completely free and unlimited TTS service
 */

import { logger } from "./logger";

interface EdgeVoice {
  Name: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  SuggestedCodec: string;
  FriendlyName: string;
  Status: string;
  VoiceTag: {
    ContentCategories: string[];
    VoicePersonalities: string[];
  };
}

/**
 * Get available voices from Edge TTS
 */
export async function getEdgeVoices(): Promise<EdgeVoice[]> {
  try {
    const response = await fetch("https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Edge TTS API error: ${response.status}`);
    }

    const voices = await response.json();
    return voices;
  } catch (error) {
    logger.error("Error fetching Edge TTS voices:", error);
    throw error;
  }
}

/**
 * Generate audio using Edge TTS
 * Edge TTS uses a specific endpoint format
 */
export async function generateEdgeAudio(
  text: string,
  voice: string = "tr-TR-EmelNeural" // Turkish female voice
): Promise<Buffer> {
  try {
    // Edge TTS uses SSML format
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="tr-TR">
        <voice name="${voice}">
          ${text}
        </voice>
      </speak>
    `;

    // Edge TTS endpoint - using the correct format
    const url = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge TTS API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    logger.error("Error generating Edge TTS audio:", error);
    throw new Error(`Edge TTS hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

/**
 * Get Turkish voices from Edge TTS
 */
export async function getTurkishEdgeVoices(): Promise<EdgeVoice[]> {
  const voices = await getEdgeVoices();
  return voices.filter((voice) => voice.Locale.startsWith("tr-"));
}

