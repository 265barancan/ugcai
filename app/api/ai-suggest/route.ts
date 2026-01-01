import { NextRequest, NextResponse } from "next/server";
import { generateTextSuggestion, generateVideoSummary, generateThumbnailDescription } from "@/lib/ai";
import { logger } from "@/lib/logger";
import { AIModel } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { model, type, text, context, videoUrl } = await request.json();

    if (!model || !type || !text) {
      return NextResponse.json(
        { success: false, error: "Model, type, and text are required" },
        { status: 400 }
      );
    }

    if (!["gemini", "grok", "deepseek"].includes(model)) {
      return NextResponse.json(
        { success: false, error: "Invalid AI model. Supported: gemini, grok, deepseek" },
        { status: 400 }
      );
    }

    let result: string;

    switch (type) {
      case "text-suggestion":
        result = await generateTextSuggestion(model as AIModel, text, context);
        break;
      case "video-summary":
        result = await generateVideoSummary(model as AIModel, text, videoUrl);
        break;
      case "thumbnail-description":
        result = await generateThumbnailDescription(model as AIModel, text);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid type. Supported: text-suggestion, video-summary, thumbnail-description" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result: result,
    });
  } catch (error: any) {
    logger.error("Error in AI suggest API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "AI önerisi oluşturulamadı",
      },
      { status: 500 }
    );
  }
}

