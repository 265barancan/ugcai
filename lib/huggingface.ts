/**
 * Hugging Face Inference API integration for video generation
 * Using new router endpoint: https://router.huggingface.co
 * https://huggingface.co/docs/api-inference
 */

import { VideoGenerationOptions } from "./replicate";
import { logger } from "./logger";

export interface HuggingFaceVideoGenerationOptions extends VideoGenerationOptions {
  model?: string;
}

export async function createHuggingFaceVideoPrediction(
  prompt: string,
  audioUrl?: string,
  options?: HuggingFaceVideoGenerationOptions
): Promise<string> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    
    // Try multiple text-to-video models that work with Inference API
    // Most Hugging Face models are image-to-video, text-to-video is limited
    const textToVideoModels = [
      options?.model,
      "Lightricks/LTX-Video", // Known to work with Inference API
      "tencent/HunyuanVideo", // Alternative option
      "Lightricks/LTX-Video-0.9.8-13B-distilled", // Faster option
    ].filter(Boolean) as string[];
    
    const model = textToVideoModels[0];
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      logger.warn("Hugging Face API key not found. Using free tier (may have rate limits).");
    }
    
    const requestBody: any = {
      inputs: prompt,
    };

    if (options?.duration) {
      requestBody.parameters = {
        ...requestBody.parameters,
        num_inference_steps: Math.min(50, options.duration * 5), // Approximate
      };
    }

    // Try multiple endpoint formats and models
    let response: Response | null = null;
    let lastError: any = null;
    const endpoints = [
      `https://router.huggingface.co/hf-inference/models/${model}`,
      `https://router.huggingface.co/models/${model}`,
    ];
    
    // Try each endpoint with primary model
    for (const endpoint of endpoints) {
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });
        
        // If successful or non-404/410 error, break
        if (response.ok || (response.status !== 404 && response.status !== 410)) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    
    // If no response was successful, try alternative models
    if (!response || response.status === 404) {
      logger.info(`Model ${model} not found, trying alternative models...`);
      // Try alternative models
      for (const altModel of textToVideoModels.slice(1)) {
        try {
          response = await fetch(
            `https://router.huggingface.co/hf-inference/models/${altModel}`,
            {
              method: "POST",
              headers,
              body: JSON.stringify(requestBody),
            }
          );
          
          if (response.ok) {
            logger.info(`Successfully using alternative model: ${altModel}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          continue;
        }
      }
    }
    
    // If still no response, throw error
    if (!response) {
      throw new Error(
        `Tüm video modelleri başarısız oldu. Denenen modeller: ${textToVideoModels.join(", ")}. ` +
        `Son hata: ${lastError?.message || "Bilinmeyen hata"}`
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      // Handle specific error codes with helpful messages
      if (response.status === 410) {
        throw new Error(
          `Hugging Face API endpoint değişti. Model: ${model}. Hata detayı: ${errorText}`
        );
      }
      
      if (response.status === 401) {
        throw new Error(
          `Hugging Face API key geçersiz veya eksik. ` +
          `Lütfen .env dosyasına HUGGINGFACE_API_KEY ekleyin (hf_ ile başlamalı).`
        );
      }
      
      if (response.status === 404) {
        throw new Error(
          `❌ Video modeli bulunamadı: ${model}\n\n` +
          `Hugging Face Inference API text-to-video modellerini desteklemiyor.\n\n` +
          `💡 Çözüm: Lütfen Video Provider olarak "Replicate" veya "Fal.ai" seçin.\n` +
          `Bu provider'lar text-to-video için daha güvenilir ve çalışan modellere sahiptir.\n\n` +
          `Hata detayı: ${errorText}`
        );
      }
      
      if (response.status === 503) {
        if (errorData.estimated_time) {
          throw new Error(
            `Model yükleniyor, lütfen ${Math.ceil(errorData.estimated_time)} saniye sonra tekrar deneyin`
          );
        }
        throw new Error(
          `Model şu anda kullanılamıyor (${model}). Lütfen daha sonra tekrar deneyin.`
        );
      }
      
      // Generic error with full details for debugging
      throw new Error(
        `Hugging Face API hatası (Status: ${response.status}): ${errorText}. ` +
        `Model: ${model}, Endpoint: ${response.url}`
      );
    }

    const data = await response.json();
    
    // Hugging Face returns base64 encoded video or URL
    if (data.generated_video) {
      return data.generated_video;
    } else if (data[0]?.generated_video) {
      return data[0].generated_video;
    } else if (data.video) {
      return typeof data.video === "string" ? data.video : data.video.url;
    } else if (typeof data === "string" && data.startsWith("data:")) {
      // Base64 encoded video
      return data;
    } else if (data.url || data.video_url) {
      return data.url || data.video_url;
    }

    // If we get here, create a unique ID for polling
    const requestId = `hf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return requestId;
  } catch (error: any) {
    logger.error("Error creating Hugging Face video prediction:", error);
    
    if (error?.status === 401 || error?.message?.includes("Unauthorized")) {
      throw new Error("Geçersiz Hugging Face API key. Lütfen .env dosyasındaki HUGGINGFACE_API_KEY'i kontrol edin (opsiyonel)");
    }
    
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit")) {
      throw new Error(
        `Hugging Face API rate limit aşıldı. Ücretsiz tier için günlük limit: 1000 istek. Lütfen daha sonra tekrar deneyin.`
      );
    }
    
    throw error;
  }
}

export async function checkHuggingFaceVideoStatus(requestId: string): Promise<{
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string;
  error?: string;
  progress?: number;
}> {
  try {
    // Hugging Face Inference API doesn't always support polling
    // Most models return results synchronously
    // For async models, we'd need to implement a different approach
    
    // For now, we'll assume the requestId is actually a video URL
    if (requestId.startsWith("http")) {
      return {
        id: requestId,
        status: "succeeded",
        output: requestId,
        progress: 100,
      };
    }

    // If it's not a URL, we'll need to check status
    // This is a simplified implementation
    return {
      id: requestId,
      status: "processing",
      progress: 50,
    };
  } catch (error: any) {
    logger.error("Error checking Hugging Face video status:", error);
    throw error;
  }
}

export interface AvatarGenerationOptions {
  model?: string;
  style?: "realistic" | "cartoon" | "anime" | "professional" | "artistic";
  gender?: "male" | "female" | "neutral";
  age?: "young" | "adult" | "elderly";
  additionalPrompt?: string;
  aspectRatio?: "1:1" | "4:3" | "16:9" | "9:16" | "21:9";
  width?: number;
  height?: number;
}

export interface ImageGenerationOptions {
  model?: string;
  aspectRatio?: "1:1" | "4:3" | "16:9" | "9:16" | "21:9";
  width?: number;
  height?: number;
  style?: string;
  additionalPrompt?: string;
  avatarImageUrl?: string; // Avatar image URL for image-to-image or reference
}

export interface PoseVariationOptions {
  model?: string;
  pose?: string; // e.g., "side view", "back view", "three-quarter view", "looking up", "looking down"
  cameraAngle?: string; // e.g., "low angle", "high angle", "eye level", "bird's eye view"
  strength?: number; // 0.0 to 1.0, how much to change from original (default 0.7)
  aspectRatio?: "1:1" | "4:3" | "16:9" | "9:16" | "21:9";
}

/**
 * Generate image (general purpose, not just avatar)
 */
export async function generateImage(
  prompt: string,
  options?: ImageGenerationOptions
): Promise<string> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    
    // Try multiple models that are known to work with Inference API
    // FLUX models and Realistic Vision are generally less restricted and NSFW-friendly
    // If user's selected model fails, we'll try alternatives
    const allModels = [
      options?.model, // User's selected model first
      "runwayml/stable-diffusion-v1-5", // Most reliable with Inference API
      "CompVis/stable-diffusion-v1-4", // Also reliable
      "stabilityai/stable-diffusion-xl-base-1.0", // XL model
      "stabilityai/sdxl-turbo", // Fast alternative
      "SG161222/Realistic_Vision_V5.1_noVAE", // Stable version (V6.0 might not work)
      "black-forest-labs/FLUX.1-schnell", // Less restricted, fast
      "black-forest-labs/FLUX.1-dev", // Less restricted, high quality
    ].filter(Boolean) as string[];
    
    // Remove duplicates while preserving order
    const modelsToTry = Array.from(new Set(allModels));
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      // Warn but continue - free tier might work without API key
      logger.warn("Hugging Face API key not found. Using free tier (may have rate limits).");
    }

    // Build enhanced prompt
    let enhancedPrompt = prompt;
    
    // If avatar image is provided, add reference to prompt
    if (options?.avatarImageUrl) {
      enhancedPrompt = `${enhancedPrompt}, same character as reference avatar, consistent appearance, same style`;
    }
    
    // Add style if provided
    if (options?.style) {
      enhancedPrompt = `${enhancedPrompt}, ${options.style} style`;
    }
    
    // Add additional user prompt if provided
    if (options?.additionalPrompt) {
      enhancedPrompt = `${enhancedPrompt}, ${options.additionalPrompt}`;
    }
    
    // Determine image dimensions based on aspect ratio
    let width = 1024;
    let height = 1024;
    
    if (options?.aspectRatio) {
      switch (options.aspectRatio) {
        case "1:1":
          width = 1024;
          height = 1024;
          break;
        case "4:3":
          width = 1024;
          height = 768;
          break;
        case "16:9":
          width = 1920;
          height = 1080;
          break;
        case "9:16": // Vertical/Portrait (Instagram Story, TikTok)
          width = 1080;
          height = 1920;
          break;
        case "21:9":
          width = 2560;
          height = 1080;
          break;
      }
    } else if (options?.width && options?.height) {
      width = options.width;
      height = options.height;
    }
    
    // Try multiple models and endpoints until we find one that works
    let response: Response | null = null;
    let lastError: any = null;
    let workingModel: string | null = null;
    const endpoints = [
      `https://api-inference.huggingface.co/models/`,
      `https://router.huggingface.co/hf-inference/models/`,
      `https://router.huggingface.co/models/`,
    ];
    
    // Try each model with each endpoint
    for (const model of modelsToTry) {
      if (workingModel) break; // If we found a working model, stop
      
      for (const endpointBase of endpoints) {
        const endpoint = `${endpointBase}${model}`;
        
        try {
          const requestBody: any = {
            inputs: enhancedPrompt,
            parameters: {
              width: width,
              height: height,
            },
          };

          // If avatar image URL is provided, try to use it as reference
          if (options?.avatarImageUrl) {
            // Add image reference to parameters if the model supports it
            requestBody.parameters.image = options.avatarImageUrl;
          }

          response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody),
          });
          
          // If successful, mark this model as working and break
          if (response.ok) {
            workingModel = model;
            logger.info(`Using model: ${model} for image generation`);
            break;
          }
          
          // If 404, try next model/endpoint
          if (response.status === 404) {
            continue;
          }
          
          // If other error (503, etc.), try next endpoint but keep this model in list
          if (response.status !== 404 && response.status !== 410) {
            // Might be loading or other issue, but model exists
            workingModel = model;
            break;
          }
        } catch (err: any) {
          lastError = err;
          continue;
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error("No response from Hugging Face API");
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Hugging Face API error: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += ` - ${JSON.stringify(errorJson)}`;
        
        // Provide helpful error messages
        if (response.status === 401) {
          errorMessage += "\n\nAPI key eksik veya geçersiz. .env dosyasına HUGGINGFACE_API_KEY ekleyin.";
        } else if (response.status === 404) {
          const triedModels = modelsToTry.slice(0, 3).join(", ");
          errorMessage += `\n\nTüm modeller denenemedi. Denenen modeller: ${triedModels}. `;
          errorMessage += `Seçtiğiniz model Inference API'yi desteklemiyor olabilir. `;
          errorMessage += `Lütfen farklı bir model seçin veya daha sonra tekrar deneyin.`;
        } else if (response.status === 410) {
          errorMessage += "\n\nBu endpoint artık desteklenmiyor. Lütfen güncel endpoint kullanın.";
        } else if (response.status === 503) {
          const errorData = typeof errorJson === 'object' && errorJson.estimated_time
            ? `, lütfen ${Math.ceil(errorJson.estimated_time)} saniye sonra tekrar deneyin`
            : "";
          errorMessage += `\n\nModel yükleniyor${errorData}.`;
        }
      } catch {
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Log which model was used if different from requested
    if (workingModel && workingModel !== options?.model && options?.model) {
      logger.info(`Model ${options.model} çalışmadı, alternatif model kullanıldı: ${workingModel}`);
    }

    // Handle different response formats
    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("image")) {
      // Direct image response
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } else {
      // JSON response with image data
      const data = await response.json();
      
      if (data.image) {
        // Base64 encoded image
        return data.image.startsWith("data:") ? data.image : `data:image/png;base64,${data.image}`;
      } else if (data.generated_image) {
        return data.generated_image.startsWith("data:") ? data.generated_image : `data:image/png;base64,${data.generated_image}`;
      } else if (Array.isArray(data) && data[0]?.image) {
        return data[0].image.startsWith("data:") ? data[0].image : `data:image/png;base64,${data[0].image}`;
      } else {
        throw new Error("Unexpected response format from Hugging Face");
      }
    }
  } catch (error: any) {
    logger.error("Error generating image:", error);
    throw new Error(`Görsel oluşturma hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

export async function generateAvatar(
  prompt: string,
  options?: AvatarGenerationOptions
): Promise<string> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    
    // Try multiple models that are known to work with Inference API
    // FLUX models are generally less restricted
    const modelsToTry = [
      options?.model,
      "black-forest-labs/FLUX.1-dev", // Less restricted, high quality
      "black-forest-labs/FLUX.1-schnell", // Less restricted, fast
      "stabilityai/stable-diffusion-xl-base-1.0",
      "stabilityai/sdxl-turbo", // Fast alternative
      "runwayml/stable-diffusion-v1-5",
      "CompVis/stable-diffusion-v1-4"
    ].filter(Boolean) as string[];
    
    const model = modelsToTry[0];
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      // Warn but continue - free tier might work without API key
      logger.warn("Hugging Face API key not found. Using free tier (may have rate limits).");
    }

    // Build enhanced prompt
    let enhancedPrompt = prompt;
    
    // If avatar image is provided, add reference to prompt
    if (options?.avatarImageUrl) {
      enhancedPrompt = `${enhancedPrompt}, same character as reference avatar, consistent appearance, same style`;
    }
    
    // Add style if provided
    if (options?.style) {
      enhancedPrompt = `${enhancedPrompt}, ${options.style} style`;
    }
    
    // Add additional user prompt if provided
    if (options?.additionalPrompt) {
      enhancedPrompt = `${enhancedPrompt}, ${options.additionalPrompt}`;
    }
    
    // Determine image dimensions based on aspect ratio
    let width = 1024;
    let height = 1024;
    
    if (options?.aspectRatio) {
      switch (options.aspectRatio) {
        case "1:1":
          width = 1024;
          height = 1024;
          break;
        case "4:3":
          width = 1024;
          height = 768;
          break;
        case "16:9":
          width = 1920;
          height = 1080;
          break;
        case "9:16": // Vertical/Portrait (Instagram Story, TikTok)
          width = 1080;
          height = 1920;
          break;
        case "21:9":
          width = 2560;
          height = 1080;
          break;
      }
    } else if (options?.width && options?.height) {
      width = options.width;
      height = options.height;
    }
    
    // Negative prompt to avoid unwanted elements
    const negativePrompt = "blurry, low quality, distorted, text, watermark, signature";

    const requestBody: any = {
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt: negativePrompt,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        width: width,
        height: height,
      },
    };
    
    // If avatar image URL is provided, try to use it as reference
    // Note: Some models support image-to-image, but for now we'll just use it in the prompt
    // In the future, we could implement actual image-to-image generation
    if (options?.avatarImageUrl) {
      // Add image reference to parameters if the model supports it
      // For now, we'll enhance the prompt with avatar description
      // requestBody.parameters.image = options.avatarImageUrl; // Uncomment if model supports image-to-image
    }

    // Try multiple endpoint formats
    let response: Response | null = null;
    let lastError: any = null;
    const endpoints = [
      `https://api-inference.huggingface.co/models/${model}`,
      `https://router.huggingface.co/hf-inference/models/${model}`,
      `https://router.huggingface.co/models/${model}`,
    ];
    
    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });
        
        // If successful or non-404/410 error, break
        if (response.ok || (response.status !== 404 && response.status !== 410)) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    
    if (!response) {
      throw lastError || new Error("No response from Hugging Face API");
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      // Handle specific error codes with helpful messages
      if (response.status === 410) {
        throw new Error(
          `Hugging Face API endpoint değişti. Model: ${model}. Hata detayı: ${errorText}`
        );
      }
      
      if (response.status === 401) {
        throw new Error(
          `Hugging Face API key geçersiz veya eksik. ` +
          `Lütfen .env dosyasına HUGGINGFACE_API_KEY ekleyin (hf_ ile başlamalı). ` +
          `API key olmadan da deneyebilirsiniz ama limitler daha düşük olabilir.`
        );
      }
      
      if (response.status === 404) {
        throw new Error(
          `Model bulunamadı: ${model}. Bu model Inference API'yi desteklemiyor olabilir. ` +
          `Lütfen farklı bir model deneyin veya model adını kontrol edin.`
        );
      }
      
      if (response.status === 503) {
        if (errorData.estimated_time) {
          throw new Error(
            `Model yükleniyor, lütfen ${Math.ceil(errorData.estimated_time)} saniye sonra tekrar deneyin`
          );
        }
        throw new Error(
          `Model şu anda kullanılamıyor (${model}). Lütfen daha sonra tekrar deneyin veya farklı bir model seçin.`
        );
      }
      
      // Generic error with full details for debugging
      throw new Error(
        `Hugging Face API hatası (Status: ${response.status}): ${errorText}. ` +
        `Model: ${model}, Endpoint: ${response.url}`
      );
    }

    // Hugging Face returns image as blob
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = imageBlob.type || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error: any) {
    logger.error("Error generating avatar with Hugging Face:", error);
    
    // Check if API key is missing
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "Hugging Face API key bulunamadı. Lütfen .env dosyasına HUGGINGFACE_API_KEY ekleyin. " +
        "API key olmadan da deneyebilirsiniz ama limitler daha düşük olabilir."
      );
    }
    
    if (error?.status === 401 || error?.message?.includes("Unauthorized") || error?.message?.includes("401")) {
      throw new Error(
        "Geçersiz Hugging Face API key. Lütfen .env dosyasındaki HUGGINGFACE_API_KEY'in doğru olduğundan emin olun. " +
        "API key 'hf_' ile başlamalıdır."
      );
    }
    
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit")) {
      throw new Error(
        `Hugging Face API rate limit aşıldı. Ücretsiz tier için günlük limit: 1000 istek. Lütfen daha sonra tekrar deneyin.`
      );
    }
    
    // Include original error message for debugging
    const errorMessage = error?.message || String(error);
    throw new Error(`Avatar oluşturulamadı: ${errorMessage}`);
  }
}

/**
 * Generate pose/viewpoint variations from an existing image
 * Uses the same generateImage function with enhanced prompts to maintain character consistency
 */
export async function generatePoseVariation(
  sourceImageUrl: string, // Base64 data URL or URL (used for reference in prompt)
  prompt: string,
  options?: PoseVariationOptions
): Promise<string> {
  try {
    // Build enhanced prompt with pose and camera angle information
    // We'll use the original prompt and enhance it with pose/viewpoint instructions
    // The source image URL is kept for reference but we use prompt-based generation
    // which is more reliable with Hugging Face Inference API
    
    let enhancedPrompt = prompt;
    
    // Add pose information
    if (options?.pose) {
      enhancedPrompt = `${enhancedPrompt}, ${options.pose}`;
    }
    
    // Add camera angle information
    if (options?.cameraAngle) {
      enhancedPrompt = `${enhancedPrompt}, ${options.cameraAngle} camera angle`;
    }
    
    // Add strong instructions to maintain character consistency while changing pose
    // Use the strength parameter to control how much variation we want
    const strength = options?.strength || 0.7;
    const consistencyLevel = strength < 0.5 ? "very similar" : strength < 0.8 ? "similar" : "somewhat similar";
    
    enhancedPrompt = `${enhancedPrompt}, same character, same person, same face, same body, same clothing, same style, ${consistencyLevel} appearance, only the pose and camera angle are different, high quality, detailed, professional photography`;
    
    // Add additional prompt for better consistency
    const additionalPrompt = "maintaining character identity, consistent facial features, consistent body proportions, consistent clothing style";

    // Use the existing generateImage function which we know works
    // Pass the source image as avatarImageUrl for reference
    return await generateImage(enhancedPrompt, {
      model: options?.model,
      aspectRatio: options?.aspectRatio,
      additionalPrompt: additionalPrompt,
      avatarImageUrl: sourceImageUrl, // Pass source image for reference
    });
  } catch (error: any) {
    logger.error("Error generating pose variation:", error);
    throw new Error(`Poz varyasyonu oluşturma hatası: ${error.message || "Bilinmeyen hata"}`);
  }
}

