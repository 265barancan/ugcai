import { NextRequest, NextResponse } from "next/server";
import { checkVideoStatus } from "@/lib/replicate";
import { checkFalVideoStatus } from "@/lib/fal";
import { checkHuggingFaceVideoStatus } from "@/lib/huggingface";
import { VideoProvider } from "@/types";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const predictionId = searchParams.get("predictionId");
    const provider = (searchParams.get("provider") || "replicate") as VideoProvider;

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: "Prediction ID is required" },
        { status: 400 }
      );
    }

    let status;

    switch (provider) {
      case "replicate":
        status = await checkVideoStatus(predictionId);
        break;
      case "fal":
        status = await checkFalVideoStatus(predictionId);
        break;
      case "huggingface":
        status = await checkHuggingFaceVideoStatus(predictionId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Geçersiz video provider: ${provider}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    logger.error("Error in video-status API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check video status",
      },
      { status: 500 }
    );
  }
}

