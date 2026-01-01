/**
 * Video provider utilities and configuration
 */

import { VideoProvider, VideoProviderConfig } from "@/types";

export const VIDEO_PROVIDERS: VideoProviderConfig[] = [
  {
    provider: "replicate",
    name: "Replicate",
    description: "Yüksek kalite, ücretli (ücretsiz tier sınırlı)",
    icon: "⚡",
    requiresApiKey: true,
    apiKeyEnv: "REPLICATE_API_TOKEN",
    supportsAudio: true,
    audioSupportNote: "Google Veo 3.1 ile ses senkronizasyonu desteklenir",
  },
  {
    provider: "fal",
    name: "Fal.ai",
    description: "Hızlı ve güvenilir, günlük 100 ücretsiz istek",
    icon: "🚀",
    requiresApiKey: true,
    apiKeyEnv: "FAL_API_KEY",
    supportsAudio: false,
    audioSupportNote: "Ses desteği model bazlıdır, bazı modeller destekler",
  },
  {
    provider: "huggingface",
    name: "Hugging Face",
    description: "Açık kaynak, günlük 1000 ücretsiz istek",
    icon: "🤗",
    requiresApiKey: false, // Optional but recommended
    apiKeyEnv: "HUGGINGFACE_API_KEY",
    supportsAudio: false,
    audioSupportNote: "Çoğu model sadece text-to-video destekler",
  },
];

export function getProviderConfig(provider: VideoProvider): VideoProviderConfig {
  const config = VIDEO_PROVIDERS.find((p) => p.provider === provider);
  if (!config) {
    throw new Error(`Unknown video provider: ${provider}`);
  }
  return config;
}

export function isProviderAvailable(provider: VideoProvider): boolean {
  const config = getProviderConfig(provider);
  
  if (!config.requiresApiKey) {
    return true; // Hugging Face doesn't require API key
  }
  
  if (config.apiKeyEnv) {
    const apiKey = process.env[config.apiKeyEnv]?.trim();
    return !!apiKey && apiKey.length > 10;
  }
  
  return false;
}

export function getAvailableProviders(): VideoProvider[] {
  return VIDEO_PROVIDERS.filter((p) => isProviderAvailable(p.provider)).map((p) => p.provider);
}

// Client-side safe export
export const VIDEO_PROVIDERS_CLIENT = VIDEO_PROVIDERS;

