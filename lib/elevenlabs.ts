// Using direct HTTP requests instead of client library for better compatibility
import { logger } from "./logger";

export async function generateAudio(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  try {
    // Validate API key first (trimmed)
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set in environment variables");
    }
    
    // Validate API key format (should not be empty and should have reasonable length)
    if (apiKey.length < 10) {
      throw new Error("ELEVENLABS_API_KEY appears to be invalid (too short)");
    }
    
    // Default voice ID: Use premium voice if available, otherwise fallback
    // Premium voices are usually more natural sounding
    // You can change this or set ELEVENLABS_VOICE_ID in .env to use a different voice
    let defaultVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID;
    
    // If no voice ID provided, we'll let the frontend select the first (best) voice
    // For now, use a well-known premium multilingual voice as fallback (works great with Turkish)
    if (!defaultVoiceId) {
      // Using Bella - excellent multilingual voice that works perfectly with Turkish
      defaultVoiceId = "EXAVITQu4vr4xnSDxMaL"; // Bella - natural multilingual female voice, excellent Turkish
    }
    
    // Trim whitespace from voice ID
    defaultVoiceId = defaultVoiceId.trim();
    
    // Validate Voice ID format (should be 21 characters alphanumeric)
    if (defaultVoiceId && !/^[a-zA-Z0-9]{21}$/.test(defaultVoiceId)) {
      logger.warn(`Invalid Voice ID format: "${defaultVoiceId}" (length: ${defaultVoiceId.length}). Using default voice.`);
      defaultVoiceId = "EXAVITQu4vr4xnSDxMaL"; // Bella - natural multilingual female voice, excellent Turkish
    }
    
    logger.debug(`Using Voice ID: ${defaultVoiceId}`);
    logger.debug(`Text length: ${text.length} characters`);
    logger.debug(`API Key exists: ${!!apiKey}`);
    logger.debug(`API Key length: ${apiKey.length}`);
    logger.debug(`API Key first 5 chars: ${apiKey.substring(0, 5)}...`);
    
    // Use direct HTTP request to ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    logger.error("Error generating audio:", error);
    logger.error("Error details:", JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    const errorMessage = error?.message || error?.toString() || "";
    
    if (errorMessage.includes("pattern") || errorMessage.includes("string did not match") || errorMessage.includes("expected pattern")) {
      throw new Error(
        "API key veya Voice ID formatı geçersiz. Lütfen kontrol edin:\n" +
        "- ELEVENLABS_API_KEY'in başında/sonunda boşluk olmamalı\n" +
        "- ELEVENLABS_VOICE_ID 21 karakter olmalı (veya .env'den silin, varsayılan kullanılacak)\n" +
        `Hata detayı: ${errorMessage}`
      );
    }
    
    if (error?.status === 401 || errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
      throw new Error("Geçersiz ElevenLabs API key. Lütfen .env dosyasındaki ELEVENLABS_API_KEY'i kontrol edin");
    }
    
    // Re-throw with more context
    throw new Error(`ElevenLabs API hatası: ${errorMessage}`);
  }
}

export async function getVoices() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set in environment variables");
    }

    // Use direct HTTP request to ElevenLabs API
    const httpResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!httpResponse.ok) {
      const errorText = await httpResponse.text();
      throw new Error(`ElevenLabs API error: ${httpResponse.status} - ${errorText}`);
    }

    const data = await httpResponse.json();
    let voices = data.voices || [];
    
    // Map to our Voice interface format
    voices = voices.map((voice: any) => ({
      voice_id: voice.voice_id || voice.id,
      name: voice.name || 'Unknown',
      category: voice.category || voice.labels?.category,
      description: voice.description || voice.labels?.description,
      preview_url: voice.preview_url || voice.samples?.[0]?.preview_url,
      labels: voice.labels || {},
      // Keep original data for sorting
      _original: voice,
    }));

    // Known high-quality Turkish voice IDs
    // User-provided Turkish voice IDs
    const QUALITY_TURKISH_VOICE_IDS = [
      "krLzmW3By9JzaVy294Ux", // Turkish voice 1
      "fg8pljYEn5ahwjyOQaro", // Turkish voice 2
      "NNn9dv8zq2kUo7d3JSGG", // Turkish voice 3
      "5nr6ATQepuidiLb6OT3B", // Turkish voice 4
      "pMQM2vAjnEa9PmfDvgkY", // Turkish voice 5
      "n1k2o6h2qrpsjPldwAWN", // Turkish voice 6
      "1Iy00CVh3yqYLlZBmEFo", // Turkish voice 7
      "H9xk2HncwpOKhhzbyWsd", // Turkish voice 8
      "N0wraTTB0pquzsz3DLG8", // Turkish voice 9
    ];

    // Helper function to check if voice is Turkish
    const isTurkishVoice = (voice: any) => {
      const name = (voice.name || "").toLowerCase();
      const description = (voice.description || "").toLowerCase();
      const category = (voice.category || "").toLowerCase();
      const language = (voice.labels?.language || "").toLowerCase();
      const voiceId = voice.voice_id || "";
      
      if (QUALITY_TURKISH_VOICE_IDS.includes(voiceId)) return true;
      
      const allText = `${name} ${description} ${category} ${language}`;
      const turkishKeywords = ["turkish", "türkçe", "tr", "turkey", "turk", "multilingual"];
      return turkishKeywords.some(keyword => allText.includes(keyword));
    };

    // Sort voices by quality/priority:
    // 1. High-quality Turkish voices first (if Turkish is important)
    // 2. Premium/premade voices
    // 3. Voices with preview_url (usually better quality)
    // 4. Custom/cloned voices last
    voices.sort((a: any, b: any) => {
      const aIsTurkish = isTurkishVoice(a);
      const bIsTurkish = isTurkishVoice(b);
      const aIsQualityTurkish = QUALITY_TURKISH_VOICE_IDS.includes(a.voice_id);
      const bIsQualityTurkish = QUALITY_TURKISH_VOICE_IDS.includes(b.voice_id);
      
      // Quality Turkish voices get highest priority
      if (aIsQualityTurkish && !bIsQualityTurkish) return -1;
      if (!aIsQualityTurkish && bIsQualityTurkish) return 1;
      
      // Then other Turkish voices
      if (aIsTurkish && !bIsTurkish) return -1;
      if (!aIsTurkish && bIsTurkish) return 1;
      
      // Premium/premade voices next
      const aIsPremium = a.category === 'premade' || a.category === 'premium' || 
                        a._original?.category === 'premade' || 
                        !a._original?.category; // No category usually means premade
      const bIsPremium = b.category === 'premade' || b.category === 'premium' || 
                        b._original?.category === 'premade' || 
                        !b._original?.category;
      
      if (aIsPremium && !bIsPremium) return -1;
      if (!aIsPremium && bIsPremium) return 1;
      
      // Then by preview_url availability
      if (a.preview_url && !b.preview_url) return -1;
      if (!a.preview_url && b.preview_url) return 1;
      
      // Finally alphabetically by name
      return a.name.localeCompare(b.name);
    });

    // Remove _original field before returning
    return voices.map(({ _original, ...voice }: any) => voice);
  } catch (error: any) {
    logger.error("Error fetching voices:", error);
    logger.error("Error details:", JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    const errorMessage = error?.message || error?.toString() || "";
    if (errorMessage.includes("pattern") || errorMessage.includes("string did not match")) {
      throw new Error("API key formatı geçersiz. Lütfen .env dosyasındaki ELEVENLABS_API_KEY'i kontrol edin");
    }
    if (error?.status === 401 || errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
      throw new Error("Geçersiz ElevenLabs API key. Lütfen .env dosyasındaki ELEVENLABS_API_KEY'i kontrol edin");
    }
    
    throw error;
  }
}

