import Replicate from "replicate";
import { logger } from "./logger";
import { validateEnv } from "./env";

// Validate environment variables
const envValidation = validateEnv();
if (!envValidation.valid) {
  logger.warn(
    "Environment validation warnings:\n" +
    envValidation.errors.map((e) => `  - ${e}`).join("\n")
  );
}

if (!process.env.REPLICATE_API_TOKEN) {
  logger.warn("REPLICATE_API_TOKEN is not set in environment variables");
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface VideoGenerationOptions {
  duration?: number;
  resolution?: "720p" | "1080p" | "4K";
  style?: string;
  model?: string;
}

export interface PredictionStatus {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  progress?: number;
  logs?: string;
}

// Create a prediction and return prediction ID for polling
export async function createVideoPrediction(
  prompt: string,
  audioUrl?: string,
  options?: VideoGenerationOptions
): Promise<string> {
  try {
    const input: any = {
      prompt: prompt,
      duration: options?.duration || 8,
      resolution: options?.resolution || "1080p",
    };

    // Veo 3.1 supports audio input for synchronization
    if (audioUrl) {
      input.audio = audioUrl;
    }

    // Add style if provided
    if (options?.style) {
      input.style = options.style;
    }

    // Parse model string (format: "owner/model" or just "model")
    const modelString = options?.model || "google/veo-3.1";
    const [owner, modelName] = modelString.includes("/") 
      ? modelString.split("/") 
      : ["google", modelString];
    
    // Get model version first
    const model = await replicate.models.get(owner, modelName);
    const version = model.latest_version;

    if (!version) {
      throw new Error("Model version not found");
    }

    // Create prediction instead of running directly
    const prediction = await replicate.predictions.create({
      version: version.id,
      input: input,
    });

    return prediction.id;
  } catch (error: any) {
    logger.error("Error creating video prediction:", error);
    
    if (error?.status === 401 || error?.message?.includes("Unauthorized")) {
      throw new Error("Geçersiz Replicate API token. Lütfen .env dosyasındaki REPLICATE_API_TOKEN'i kontrol edin");
    }
    
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit") || error?.message?.includes("throttled")) {
      throw new Error(
        `Replicate API rate limit aşıldı. Lütfen birkaç saniye bekleyip tekrar deneyin.\n\n` +
        `💡 İpucu: Ödeme yöntemi eklenmemiş hesaplar için limit: 6 istek/dakika.\n` +
        `Daha yüksek limit için Replicate hesabınıza ödeme yöntemi ekleyin: https://replicate.com/account/billing`
      );
    }
    
    throw error;
  }
}

// Legacy function - kept for backward compatibility
export async function generateVideo(
  prompt: string,
  audioUrl?: string,
  retryCount: number = 0
): Promise<string> {
  const maxRetries = 3;
  
  try {
    // Using Google Veo 3.1 model for video generation
    // Veo 3.1 supports audio synchronization and high-quality video generation
    const input: any = {
      prompt: prompt,
      duration: 8, // 8 seconds video
      resolution: "1080p", // High quality
    };

    // Veo 3.1 supports audio input for synchronization
    if (audioUrl) {
      input.audio = audioUrl;
    }

    // Use Veo 3.1 model
    let output;
    try {
      output = await replicate.run(
        "google/veo-3.1",
        { input }
      );
    } catch (error: any) {
      // Check for rate limit error
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit") || error?.message?.includes("throttled")) {
        // Try to extract retry_after from error response
        let retryAfter = 10; // Default to 10 seconds
        try {
          // Check various possible locations for retry_after
          if (error?.retry_after) {
            retryAfter = parseInt(error.retry_after);
          } else if (error?.response?.retry_after) {
            retryAfter = parseInt(error.response.retry_after);
          } else if (error?.response?.data?.retry_after) {
            retryAfter = parseInt(error.response.data.retry_after);
          } else if (error?.data?.retry_after) {
            retryAfter = parseInt(error.data.retry_after);
          } else {
            // Try to parse from error message/string
            const errorStr = JSON.stringify(error) + (error?.message || '') + (error?.detail || '');
            const match = errorStr.match(/retry_after["\s:]+(\d+)/i);
            if (match) retryAfter = parseInt(match[1]);
          }
        } catch (e) {
          // Use default if parsing fails
          logger.debug("Could not parse retry_after, using default 10 seconds");
        }
        
        if (retryCount < maxRetries) {
          logger.debug(`Rate limit hit. Retrying after ${retryAfter} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
          await wait(retryAfter * 1000);
          return generateVideo(prompt, audioUrl, retryCount + 1);
        } else {
          throw new Error(
            `Replicate API rate limit aşıldı. Lütfen birkaç saniye bekleyip tekrar deneyin.\n` +
            `Ödeme yöntemi eklenmemiş hesaplar için limit: 6 istek/dakika.\n` +
            `Limit sıfırlanana kadar bekleyin veya Replicate hesabınıza ödeme yöntemi ekleyin.`
          );
        }
      }
      
      // If it's not a rate limit error, throw it
      throw error;
    }

    // Output can be a string URL or array
    if (typeof output === "string") {
      return output;
    } else if (Array.isArray(output) && output.length > 0) {
      return output[0] as string;
    } else if (output && typeof output === "object" && "output" in output) {
      const videoOutput = (output as any).output;
      if (typeof videoOutput === "string") {
        return videoOutput;
      } else if (Array.isArray(videoOutput) && videoOutput.length > 0) {
        return videoOutput[0] as string;
      }
    }
    
    throw new Error("Unexpected output format from Replicate");
  } catch (error: any) {
    logger.error("Error generating video:", error);
    
    // Provide more helpful error messages
    if (error?.status === 401 || error?.message?.includes("Unauthorized")) {
      throw new Error("Geçersiz Replicate API token. Lütfen .env dosyasındaki REPLICATE_API_TOKEN'i kontrol edin");
    }
    
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit") || error?.message?.includes("throttled")) {
      const retryAfter = error?.retry_after || 10;
      throw new Error(
        `Replicate API rate limit aşıldı. Lütfen ${retryAfter} saniye bekleyip tekrar deneyin.\n\n` +
        `💡 İpucu: Ödeme yöntemi eklenmemiş hesaplar için limit: 6 istek/dakika.\n` +
        `Daha yüksek limit için Replicate hesabınıza ödeme yöntemi ekleyin: https://replicate.com/account/billing`
      );
    }
    
    // If error message is already user-friendly, throw it as is
    if (error?.message && error.message.includes("rate limit")) {
      throw error;
    }
    
    throw error;
  }
}

export async function checkVideoStatus(predictionId: string): Promise<PredictionStatus> {
  try {
    const prediction = await replicate.predictions.get(predictionId);
    
    // Extract video URL from output
    let videoUrl: string | undefined;
    if (prediction.output) {
      if (typeof prediction.output === "string") {
        videoUrl = prediction.output;
      } else if (Array.isArray(prediction.output) && prediction.output.length > 0) {
        videoUrl = prediction.output[0] as string;
      }
    }
    
    return {
      id: prediction.id,
      status: prediction.status as PredictionStatus["status"],
      output: videoUrl,
      error: prediction.error as string | undefined,
      logs: prediction.logs as string | undefined,
      // Replicate doesn't provide exact progress percentage, but we can estimate based on status
      progress: prediction.status === "succeeded" ? 100 : 
                prediction.status === "failed" || prediction.status === "canceled" ? 0 :
                prediction.status === "processing" ? 50 : 10,
    };
  } catch (error: any) {
    logger.error("Error checking video status:", error);
    throw error;
  }
}

