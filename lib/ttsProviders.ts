/**
 * TTS Provider configurations and utilities
 */

import { TTSProvider, TTSProviderConfig } from "@/types";

export const TTS_PROVIDERS: TTSProviderConfig[] = [
  {
    provider: "elevenlabs",
    name: "ElevenLabs",
    description: "Yüksek kaliteli AI ses sentezi",
    icon: "🎙️",
    isFree: false,
    requiresApiKey: true,
    apiKeyEnv: "ELEVENLABS_API_KEY",
  },
  {
    provider: "edgetts",
    name: "Edge TTS",
    description: "Microsoft Edge TTS - Tamamen ücretsiz, sınırsız",
    icon: "🌐",
    isFree: true,
    freeLimit: "Sınırsız",
    requiresApiKey: false,
  },
  {
    provider: "google",
    name: "Google Cloud TTS",
    description: "Ayda 1-4 milyon karakter ücretsiz",
    icon: "🔊",
    isFree: true,
    freeLimit: "1-4M karakter/ay",
    requiresApiKey: true,
    apiKeyEnv: "GOOGLE_TTS_API_KEY",
  },
  {
    provider: "azure",
    name: "Azure Speech",
    description: "Ayda 500.000 karakter ücretsiz",
    icon: "☁️",
    isFree: true,
    freeLimit: "500K karakter/ay",
    requiresApiKey: true,
    apiKeyEnv: "AZURE_SPEECH_KEY",
  },
];

export function getTTSProvider(provider: TTSProvider): TTSProviderConfig | undefined {
  return TTS_PROVIDERS.find((p) => p.provider === provider);
}

export function isTTSProviderAvailable(provider: TTSProvider): boolean {
  const config = getTTSProvider(provider);
  if (!config) return false;

  if (!config.requiresApiKey) return true;

  if (config.apiKeyEnv) {
    return !!process.env[config.apiKeyEnv];
  }

  return false;
}

