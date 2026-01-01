/**
 * Fal.ai API integration for video generation
 * https://fal.ai
 */

import { VideoGenerationOptions } from "./replicate";
import { logger } from "./logger";

export interface FalVideoGenerationOptions extends VideoGenerationOptions {
  model?: string;
}

export async function createFalVideoPrediction(
  prompt: string,
  audioUrl?: string,
  options?: FalVideoGenerationOptions
): Promise<string> {
  try {
    const apiKey = process.env.FAL_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("FAL_API_KEY is not set in environment variables");
    }

    // Fal.ai text-to-video model format: {model-name}/text-to-video
    // Endpoint format: https://fal.run/{model-id}
    // Example: https://fal.run/kling-video/v2.5-turbo/pro/text-to-video
    
    let modelId = options?.model || "kling-video/v2.5-turbo/pro/text-to-video";
    
    // Map old model IDs to new Fal.ai text-to-video model IDs
    const modelMapping: Record<string, string> = {
      "fal-ai/flux/dev": "kling-video/v2.5-turbo/pro/text-to-video", // FLUX is for images, use Kling for video
      "fal-ai/stable-video-diffusion": "pixverse/v5/text-to-video", // Use PixVerse for video
      "fal-ai/animate-diff": "pixverse/v5/text-to-video", // Use PixVerse
      "fal-ai/zeroscope-v2": "pixverse/v5/text-to-video", // Use PixVerse
      "fal-ai/kling-v1": "kling-video/v2.5-turbo/pro/text-to-video", // Use latest Kling
    };
    
    // Use mapped model if available, otherwise use the provided model
    modelId = modelMapping[modelId] || modelId;
    
    // Fal.ai request body format - parameters should be in "input" object
    const input: any = {
      prompt: prompt,
    };

    // Audio support depends on the model
    if (audioUrl) {
      // Some Fal.ai models support audio input
      input.audio_url = audioUrl;
    }

    if (options?.duration) {
      input.duration = options.duration;
    }

    if (options?.resolution) {
      // Convert resolution format if needed (e.g., "1080p" -> "1920x1080")
      const resolutionMap: Record<string, string> = {
        "720p": "1280x720",
        "1080p": "1920x1080",
        "4K": "3840x2160",
      };
      input.resolution = resolutionMap[options.resolution] || options.resolution;
    }
    
    // Fal.ai endpoint format: https://queue.fal.run/{model-id} or https://fal.run/{model-id}
    // Try queue endpoint first (for async operations), then direct endpoint
    let response: Response;
    try {
      response = await fetch(`https://queue.fal.run/${modelId}`, {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: input,
        }),
      });
      
      // If queue endpoint returns 404, try direct endpoint
      if (response.status === 404) {
        response = await fetch(`https://fal.run/${modelId}`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      }
    } catch (err) {
      // If queue endpoint fails, try direct endpoint
      response = await fetch(`https://fal.run/${modelId}`, {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fal.ai API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Fal.ai queue endpoint returns request_id for polling
    if (data.request_id) {
      return data.request_id;
    }
    
    // Fal.ai direct endpoint might return result immediately or request_id
    if (data.id) {
      return data.id;
    }
    
    // If video is ready immediately (direct endpoint)
    if (data.video?.url) {
      return data.video.url;
    }
    
    // Check for video in output
    if (data.output?.video) {
      const video = data.output.video;
      return typeof video === "string" ? video : video.url;
    }
    
    // Check for video URL directly
    if (data.video_url) {
      return data.video_url;
    }
    
    throw new Error(`Fal.ai API: Unexpected response format. Response: ${JSON.stringify(data)}`);
  } catch (error: any) {
    logger.error("Error creating Fal.ai video prediction:", error);
    
    if (error?.status === 401 || error?.message?.includes("Unauthorized")) {
      throw new Error("Geçersiz Fal.ai API key. Lütfen .env dosyasındaki FAL_API_KEY'i kontrol edin");
    }
    
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit")) {
      throw new Error(
        `Fal.ai API rate limit aşıldı. Lütfen birkaç saniye bekleyip tekrar deneyin.`
      );
    }
    
    throw error;
  }
}

export async function checkFalVideoStatus(requestId: string): Promise<{
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string;
  error?: string;
  progress?: number;
}> {
  try {
    const apiKey = process.env.FAL_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("FAL_API_KEY is not set");
    }

    // If requestId is already a URL, return success
    if (requestId.startsWith("http")) {
      return {
        id: requestId,
        status: "succeeded",
        output: requestId,
        progress: 100,
      };
    }

    // Check status via Fal.ai status endpoint
    // Fal.ai uses queue.fal.run/status/{request_id} for queue requests
    let response: Response;
    try {
      response = await fetch(`https://queue.fal.run/status/${requestId}`, {
        method: "GET",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      
      // If queue status endpoint returns 404, try direct status endpoint
      if (response.status === 404) {
        response = await fetch(`https://fal.run/status/${requestId}`, {
          method: "GET",
          headers: {
            "Authorization": `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (err) {
      // If queue endpoint fails, try direct endpoint
      response = await fetch(`https://fal.run/status/${requestId}`, {
        method: "GET",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fal.ai API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    let videoUrl: string | undefined;
    if (data.video) {
      videoUrl = typeof data.video === "string" ? data.video : data.video.url;
    } else if (data.output?.video) {
      videoUrl = typeof data.output.video === "string" ? data.output.video : data.output.video.url;
    } else if (data.output) {
      videoUrl = typeof data.output === "string" ? data.output : data.output[0];
    }

    const status = data.status || (videoUrl ? "succeeded" : "processing");

    return {
      id: requestId,
      status: status as "starting" | "processing" | "succeeded" | "failed" | "canceled",
      output: videoUrl,
      error: data.error as string | undefined,
      progress: status === "succeeded" ? 100 : 
                status === "failed" || status === "canceled" ? 0 :
                status === "processing" ? 50 : 10,
    };
  } catch (error: any) {
    logger.error("Error checking Fal.ai video status:", error);
    throw error;
  }
}

