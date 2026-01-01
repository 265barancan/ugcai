import { NextRequest, NextResponse } from "next/server";
import { createVideoPrediction, generateVideo } from "@/lib/replicate";
import { createFalVideoPrediction } from "@/lib/fal";
import { createHuggingFaceVideoPrediction } from "@/lib/huggingface";
import { VideoSettings, VideoProvider } from "@/types";
import { logger } from "@/lib/logger";
import { isProviderAvailable } from "@/lib/videoProviders";

export async function POST(request: NextRequest) {
  try {
    const { audioUrl, prompt, usePolling, settings, provider = "replicate", model } = await request.json();

    if (!audioUrl || !prompt) {
      return NextResponse.json(
        { success: false, error: "Audio URL and prompt are required" },
        { status: 400 }
      );
    }

    // Check if provider is available
    if (!isProviderAvailable(provider as VideoProvider)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `${provider} servisi için API key gerekli. Lütfen .env dosyasını kontrol edin.` 
        },
        { status: 400 }
      );
    }

    const videoSettings: VideoSettings = settings || {
      duration: 8,
      resolution: "1080p",
      style: "professional",
    };

    // If usePolling is true, create prediction and return prediction ID
    if (usePolling) {
      let predictionId: string;

      switch (provider) {
        case "replicate":
          predictionId = await createVideoPrediction(
            prompt,
            audioUrl,
            { ...videoSettings, model }
          );
          break;
        case "fal":
          predictionId = await createFalVideoPrediction(
            prompt,
            audioUrl,
            { ...videoSettings, model }
          );
          break;
        case "huggingface":
          // Hugging Face için özel uyarı
          if (!model || model.includes("recommend")) {
            return NextResponse.json(
              {
                success: false,
                error: "Hugging Face Inference API text-to-video modellerini desteklemiyor. " +
                       "Lütfen Replicate veya Fal.ai provider'ını seçin, veya Hugging Face için uygun bir model seçin."
              },
              { status: 400 }
            );
          }
          predictionId = await createHuggingFaceVideoPrediction(
            prompt,
            audioUrl,
            { ...videoSettings, model }
          );
          break;
        default:
          return NextResponse.json(
            { success: false, error: `Geçersiz video provider: ${provider}` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        predictionId: predictionId,
        provider: provider,
      });
    }

    // Legacy: Generate video directly (blocking) - only for Replicate
    if (provider !== "replicate") {
      return NextResponse.json(
        { success: false, error: "Direct generation only supported for Replicate. Please use polling mode." },
        { status: 400 }
      );
    }

    const videoUrl = await generateVideo(prompt, audioUrl);

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      provider: provider,
    });
  } catch (error: any) {
    logger.error("Error in generate-video API:", error);
    
    // Handle rate limit errors with appropriate status code
    const isRateLimit = error?.status === 429 || 
                       error?.message?.includes("429") || 
                       error?.message?.includes("rate limit") ||
                       error?.message?.includes("throttled");
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Video oluşturulamadı",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}

