/**
 * Azure Speech Service (Text-to-Speech) integration
 * Free tier: 500,000 characters per month
 */

import { logger } from "./logger";

/**
 * Generate audio using Azure Speech Service
 */
export async function generateAzureAudio(
  text: string,
  voiceName: string = "tr-TR-EmelNeural" // Turkish female voice
): Promise<Buffer> {
  try {
    const apiKey = process.env.AZURE_SPEECH_KEY?.trim();
    const region = process.env.AZURE_SPEECH_REGION?.trim() || "eastus";

    if (!apiKey) {
      throw new Error("AZURE_SPEECH_KEY is not set in environment variables");
    }

    // Get access token
    const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!tokenResponse.ok) {
      throw new Error(`Azure token error: ${tokenResponse.status}`);
    }

    const accessToken = await tokenResponse.text();

    // Generate speech
    const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="tr-TR">
        <voice name="${voiceName}">
          ${text}
        </voice>
      </speak>
    `;

    const response = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "AI-UGC-Video-Generator",
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure TTS API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    logger.error("Error generating Azure TTS audio:", error);
    throw new Error(`Azure TTS hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

/**
 * Get available voices from Azure Speech Service
 * @param locale Optional locale filter (e.g., "tr-TR"). If not provided, returns all voices.
 */
export async function getAzureVoices(locale?: string): Promise<any[]> {
  try {
    const apiKey = process.env.AZURE_SPEECH_KEY?.trim();
    const region = process.env.AZURE_SPEECH_REGION?.trim() || "eastus";

    if (!apiKey) {
      throw new Error("AZURE_SPEECH_KEY is not set in environment variables");
    }

    // Get access token
    const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!tokenResponse.ok) {
      throw new Error(`Azure token error: ${tokenResponse.status}`);
    }

    const accessToken = await tokenResponse.text();

    // Get voices
    const voicesUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
    const response = await fetch(voicesUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure TTS API error: ${response.status} - ${errorText}`);
    }

    const voices = await response.json();
    // If locale is provided, filter by it. Otherwise, return all voices.
    return locale ? voices.filter((voice: any) => voice.Locale === locale) : voices;
  } catch (error: any) {
    logger.error("Error fetching Azure TTS voices:", error);
    throw error;
  }
}

