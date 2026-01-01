"use client";

import { useState, useEffect } from "react";
import { VideoProvider } from "@/types";
import { VIDEO_PROVIDERS_CLIENT } from "@/lib/videoProviders";

interface VideoProviderSelectorProps {
  selectedProvider: VideoProvider;
  onProviderChange: (provider: VideoProvider) => void;
  disabled?: boolean;
}

export default function VideoProviderSelector({
  selectedProvider,
  onProviderChange,
  disabled = false,
}: VideoProviderSelectorProps) {
  const [providerAvailability, setProviderAvailability] = useState<Record<VideoProvider, boolean>>({} as Record<VideoProvider, boolean>);
  const [loading, setLoading] = useState<Record<VideoProvider, boolean>>({} as Record<VideoProvider, boolean>);

  // Check availability for all providers on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const availability: Record<VideoProvider, boolean> = {} as Record<VideoProvider, boolean>;
      const loadingState: Record<VideoProvider, boolean> = {} as Record<VideoProvider, boolean>;

      for (const providerConfig of VIDEO_PROVIDERS_CLIENT) {
        if (providerConfig.requiresApiKey) {
          loadingState[providerConfig.provider] = true;
          try {
            const response = await fetch(`/api/check-provider?provider=${providerConfig.provider}&type=video`);
            const data = await response.json();
            availability[providerConfig.provider] = data.success ? data.available : false;
          } catch (error) {
            availability[providerConfig.provider] = false;
          } finally {
            loadingState[providerConfig.provider] = false;
          }
        } else {
          // Providers that don't require API key are always available
          availability[providerConfig.provider] = true;
        }
      }

      setProviderAvailability(availability);
      setLoading(loadingState);
    };

    checkAvailability();
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Video Oluşturma Servisi
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {VIDEO_PROVIDERS_CLIENT.map((providerConfig) => {
          const isSelected = selectedProvider === providerConfig.provider;
          const isAvailable = providerConfig.requiresApiKey 
            ? (providerAvailability[providerConfig.provider] ?? true) // Default to true while loading
            : true;
          const isLoading = loading[providerConfig.provider] ?? false;
          
          return (
            <button
              key={providerConfig.provider}
              type="button"
              onClick={() => onProviderChange(providerConfig.provider)}
              disabled={disabled}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                isSelected
                  ? "bg-purple-600 text-white shadow-md border-2 border-purple-700"
                  : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border-2 border-gray-300 dark:border-gray-500"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={providerConfig.description}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{providerConfig.icon}</span>
                <span className="font-semibold">{providerConfig.name}</span>
              </div>
              <p className="text-xs opacity-90 mt-1">
                {providerConfig.description}
              </p>
              {providerConfig.requiresApiKey && (
                <p className={`text-xs mt-1 ${isLoading ? "text-gray-400" : isAvailable ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {isLoading 
                    ? "⏳ Kontrol ediliyor..." 
                    : isAvailable 
                      ? "✅ API key tanımlı" 
                      : "❌ API key tanımlı değil"}
                </p>
              )}
              {providerConfig.supportsAudio !== undefined && (
                <p className={`text-xs mt-1 ${providerConfig.supportsAudio ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                  {providerConfig.supportsAudio ? "🎵 Ses senkronizasyonu desteklenir" : "⚠️ Ses desteği sınırlı"}
                </p>
              )}
            </button>
          );
        })}
      </div>
      {selectedProvider && providerAvailability[selectedProvider] === false && VIDEO_PROVIDERS_CLIENT.find(p => p.provider === selectedProvider)?.requiresApiKey && (
        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>{VIDEO_PROVIDERS_CLIENT.find(p => p.provider === selectedProvider)?.name}</strong> için API key tanımlı değil. 
            Lütfen <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">.env</code> dosyasına <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">{VIDEO_PROVIDERS_CLIENT.find(p => p.provider === selectedProvider)?.apiKeyEnv}</code> ekleyin.
          </p>
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Ücretsiz seçenekler için Fal.ai veya Hugging Face&apos;i seçin
      </p>
    </div>
  );
}

