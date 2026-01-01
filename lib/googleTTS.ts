/**
 * Google Cloud Text-to-Speech integration
 * Free tier: 1-4 million characters per month
 */

import { logger } from "./logger";

/**
 * Generate audio using Google Cloud TTS
 */
export async function generateGoogleAudio(
  text: string,
  voiceName: string = "tr-TR-Wavenet-A" // Turkish female voice
): Promise<Buffer> {
  try {
    const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GOOGLE_TTS_API_KEY is not set in environment variables");
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "tr-TR",
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google TTS API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;

    // Decode base64 audio
    const audioBuffer = Buffer.from(audioContent, "base64");
    return audioBuffer;
  } catch (error: any) {
    logger.error("Error generating Google TTS audio:", error);
    throw new Error(`Google TTS hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

/**
 * Get available voices from Google Cloud TTS
 * @param languageCode Optional language code filter (e.g., "tr-TR"). If not provided, returns all voices.
 */
export async function getGoogleVoices(languageCode?: string): Promise<any[]> {
  try {
    const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GOOGLE_TTS_API_KEY is not set in environment variables");
    }

    // If languageCode is provided, filter by it. Otherwise, get all voices.
    const url = languageCode
      ? `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}&languageCode=${languageCode}`
      : `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google TTS API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error: any) {
    logger.error("Error fetching Google TTS voices:", error);
    throw error;
  }
}

