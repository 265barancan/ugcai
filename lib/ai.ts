/**
 * AI Model integrations for text suggestions, thumbnail generation, and video summaries
 * Supports: Gemini, Grok, DeepSeek
 */

import { AIModel, AISuggestionRequest, AISuggestionResponse } from "@/types";
import { logger } from "./logger";

// Gemini API
async function callGeminiAPI(prompt: string, context?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const fullPrompt = context 
    ? `Context: ${context}\n\nTask: ${prompt}`
    : prompt;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt,
          }],
        }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Grok API (via xAI)
async function callGrokAPI(prompt: string, context?: string): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("GROK_API_KEY is not set in environment variables");
  }

  const fullPrompt = context 
    ? `Context: ${context}\n\nTask: ${prompt}`
    : prompt;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// DeepSeek API
async function callDeepSeekAPI(prompt: string, context?: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set in environment variables");
  }

  const fullPrompt = context 
    ? `Context: ${context}\n\nTask: ${prompt}`
    : prompt;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Generate text suggestions using AI
 */
export async function generateTextSuggestion(
  model: AIModel,
  currentText: string,
  context?: string
): Promise<string> {
  const prompt = `You are a creative content writer. Based on the following text, suggest an improved or alternative version that would work well for a short video script (5-30 seconds). Keep it engaging, clear, and suitable for an influencer-style video. 

Current text: "${currentText}"

Provide only the improved text, without any explanations or additional commentary.`;

  try {
    let result: string;
    
    switch (model) {
      case "gemini":
        result = await callGeminiAPI(prompt, context);
        break;
      case "grok":
        result = await callGrokAPI(prompt, context);
        break;
      case "deepseek":
        result = await callDeepSeekAPI(prompt, context);
        break;
      default:
        throw new Error(`Unsupported AI model: ${model}`);
    }

    // Clean up the response (remove quotes if wrapped)
    result = result.trim().replace(/^["']|["']$/g, "");
    return result;
  } catch (error: any) {
    logger.error(`Error generating text suggestion with ${model}:`, error);
    throw error;
  }
}

/**
 * Generate video summary using AI
 */
export async function generateVideoSummary(
  model: AIModel,
  videoText: string,
  videoUrl?: string
): Promise<string> {
  const prompt = `Create a brief, engaging summary (2-3 sentences) of the following video content. Make it compelling and suitable for social media sharing.

Video content: "${videoText}"

Provide only the summary text, without any explanations.`;

  try {
    let result: string;
    
    switch (model) {
      case "gemini":
        result = await callGeminiAPI(prompt);
        break;
      case "grok":
        result = await callGrokAPI(prompt);
        break;
      case "deepseek":
        result = await callDeepSeekAPI(prompt);
        break;
      default:
        throw new Error(`Unsupported AI model: ${model}`);
    }

    return result.trim();
  } catch (error: any) {
    logger.error(`Error generating video summary with ${model}:`, error);
    throw error;
  }
}

/**
 * Generate thumbnail description using AI (for thumbnail generation)
 */
export async function generateThumbnailDescription(
  model: AIModel,
  videoText: string
): Promise<string> {
  const prompt = `Based on the following video content, suggest a brief visual description for a thumbnail image. The description should be clear, visual, and suitable for generating an image.

Video content: "${videoText}"

Provide only a short visual description (1-2 sentences), without any explanations.`;

  try {
    let result: string;
    
    switch (model) {
      case "gemini":
        result = await callGeminiAPI(prompt);
        break;
      case "grok":
        result = await callGrokAPI(prompt);
        break;
      case "deepseek":
        result = await callDeepSeekAPI(prompt);
        break;
      default:
        throw new Error(`Unsupported AI model: ${model}`);
    }

    return result.trim();
  } catch (error: any) {
    logger.error(`Error generating thumbnail description with ${model}:`, error);
    throw error;
  }
}

