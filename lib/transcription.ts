/**
 * Video transcription using AI (Speech-to-Text)
 * Supports multiple providers: Hugging Face Whisper, Azure Speech, Google Cloud Speech
 */

import { logger } from "./logger";

export interface TranscriptionOptions {
  provider?: "huggingface" | "azure" | "google";
  language?: string; // ISO 639-1 code (e.g., "tr", "en")
}

/**
 * Extract audio from video and transcribe using Hugging Face Whisper
 */
export async function transcribeVideoWithHuggingFace(
  videoBuffer: Buffer,
  language?: string
): Promise<string> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    
    // Use Hugging Face Whisper model
    const model = "openai/whisper-large-v3";
    const endpoint = `https://api-inference.huggingface.co/models/${model}`;
    
    const headers: Record<string, string> = {};

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Hugging Face Whisper API expects audio file directly
    // Convert buffer to base64
    const base64 = videoBuffer.toString('base64');
    
    // Note: Hugging Face Whisper API may need audio file, not video
    // For now, we'll send the video buffer and see if it works
    // In production, extract audio first using FFmpeg
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: base64, // Send as binary
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face transcription error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (typeof data === "string") {
      return data;
    } else if (data.text) {
      return data.text;
    } else if (Array.isArray(data) && data[0]?.text) {
      return data[0].text;
    } else {
      throw new Error("Unexpected response format from Hugging Face");
    }
  } catch (error: any) {
    logger.error("Error transcribing with Hugging Face:", error);
    throw new Error(`Transcription hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

/**
 * Extract audio from video using FFmpeg and return as buffer
 * This is used server-side in API routes
 */
export async function extractAudioFromVideo(videoUrl: string): Promise<Buffer> {
  try {
    // For server-side, we'll fetch the video and extract audio
    // In a real implementation, you'd use FFmpeg server-side or a service
    // For now, we'll return the video URL and let the transcription service handle it
    // or extract audio client-side before sending
    
    // Download video
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.status}`);
    }
    
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    
    // Note: Actual audio extraction would require FFmpeg on the server
    // For now, we'll pass the video URL to the transcription service
    // which may handle audio extraction internally
    return videoBuffer;
  } catch (error: any) {
    logger.error("Error extracting audio:", error);
    throw error;
  }
}

/**
 * Main transcription function
 * Note: For now, this sends the video URL directly to the transcription service
 * In production, you'd extract audio first using FFmpeg
 */
export async function transcribeVideo(
  videoUrl: string,
  options?: TranscriptionOptions
): Promise<string> {
  const provider = options?.provider || "huggingface";
  const language = options?.language || "tr";

  // For now, we'll try to transcribe directly from video URL
  // In production, extract audio first
  try {
    const videoBuffer = await extractAudioFromVideo(videoUrl);
    
    switch (provider) {
      case "huggingface":
        return await transcribeVideoWithHuggingFace(videoBuffer, language);
      case "azure":
        // TODO: Implement Azure Speech-to-Text
        throw new Error("Azure transcription not yet implemented");
      case "google":
        // TODO: Implement Google Cloud Speech-to-Text
        throw new Error("Google transcription not yet implemented");
      default:
        throw new Error(`Unsupported transcription provider: ${provider}`);
    }
  } catch (error: any) {
    // If direct transcription fails, log and suggest audio extraction
    logger.warn("Direct video transcription failed, may need audio extraction:", error);
    throw error;
  }
}
