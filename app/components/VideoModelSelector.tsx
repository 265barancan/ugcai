"use client";

import { VideoProvider } from "@/types";

// En iyi 5 ücretsiz video modeli (her provider için)
const VIDEO_MODELS = {
  replicate: [
    {
      id: "google/veo-3.1",
      name: "Google Veo 3.1",
      description: "En yüksek kalite - ses senkronizasyonu destekler",
      provider: "Replicate",
      quality: "Çok Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Ücretsiz tier: 6 istek/dakika",
    },
    {
      id: "anotherjesse/zeroscope-v2-xl",
      name: "Zeroscope v2 XL",
      description: "Yüksek kalite video - popüler ve güvenilir",
      provider: "Replicate",
      quality: "Yüksek",
      speed: "Hızlı",
      free: true,
      freeNote: "Ücretsiz tier mevcut",
    },
    {
      id: "stability-ai/stable-video-diffusion",
      name: "Stable Video Diffusion",
      description: "Stability AI - image-to-video modeli",
      provider: "Replicate",
      quality: "İyi",
      speed: "Hızlı",
      free: true,
      freeNote: "Ücretsiz tier mevcut",
    },
    {
      id: "luma/dream-machine",
      name: "Luma Dream Machine",
      description: "Hızlı ve kaliteli video üretimi",
      provider: "Replicate",
      quality: "İyi",
      speed: "Çok Hızlı",
      free: true,
      freeNote: "Ücretsiz tier mevcut",
    },
    {
      id: "meta/animate-anyone",
      name: "Meta Animate Anyone",
      description: "Karakter animasyonu için ideal",
      provider: "Replicate",
      quality: "Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Ücretsiz tier mevcut",
    },
  ],
  fal: [
    {
      id: "kling-video/v2.5-turbo/pro/text-to-video",
      name: "Kling 2.5 Turbo Pro",
      description: "En yüksek kalite - sinematik görseller, akıcı hareket",
      provider: "Fal.ai",
      quality: "Çok Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Günlük 100 ücretsiz istek",
    },
    {
      id: "veo3.1/text-to-video",
      name: "Veo 3.1",
      description: "Google DeepMind - state-of-the-art video generation",
      provider: "Fal.ai",
      quality: "Çok Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Günlük 100 ücretsiz istek",
    },
    {
      id: "pixverse/v5/text-to-video",
      name: "PixVerse v5",
      description: "Yüksek kalite video klip üretimi",
      provider: "Fal.ai",
      quality: "Yüksek",
      speed: "Hızlı",
      free: true,
      freeNote: "Günlük 100 ücretsiz istek",
    },
    {
      id: "kling-video/v2.6/pro/text-to-video",
      name: "Kling 2.6 Pro",
      description: "Ses desteği ile video üretimi",
      provider: "Fal.ai",
      quality: "Çok Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Günlük 100 ücretsiz istek",
    },
    {
      id: "ltx-2/text-to-video",
      name: "LTX-2 Pro",
      description: "Yüksek kalite video ve ses üretimi",
      provider: "Fal.ai",
      quality: "Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Günlük 100 ücretsiz istek",
    },
  ],
  huggingface: [
    {
      id: "replicate/google/veo-3.1",
      name: "Google Veo 3.1 (Replicate)",
      description: "Replicate üzerinden - en yüksek kalite",
      provider: "Replicate (via HF)",
      quality: "Çok Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Replicate API key gerekli",
      note: "Hugging Face Inference API text-to-video desteklemiyor. Replicate kullanın.",
    },
    {
      id: "fal-ai/flux/dev",
      name: "FLUX.1-dev (Fal.ai)",
      description: "Fal.ai üzerinden - yüksek kalite",
      provider: "Fal.ai (via HF)",
      quality: "Çok Yüksek",
      speed: "Orta",
      free: true,
      freeNote: "Fal.ai API key gerekli",
      note: "Hugging Face Inference API text-to-video desteklemiyor. Fal.ai kullanın.",
    },
    {
      id: "tencent/HunyuanVideo",
      name: "HunyuanVideo",
      description: "Tencent - Inference API üzerinden (sınırlı)",
      provider: "Hugging Face",
      quality: "İyi",
      speed: "Orta",
      free: true,
      freeNote: "Günlük 1000 ücretsiz istek",
      note: "⚠️ Inference API üzerinden çalışmayabilir",
    },
    {
      id: "Lightricks/LTX-Video",
      name: "LTX-Video",
      description: "Lightricks - Inference API üzerinden (sınırlı)",
      provider: "Hugging Face",
      quality: "İyi",
      speed: "Orta",
      free: true,
      freeNote: "Günlük 1000 ücretsiz istek",
      note: "⚠️ Inference API üzerinden çalışmayabilir",
    },
    {
      id: "recommend-replicate",
      name: "Replicate Kullanın",
      description: "Hugging Face text-to-video için uygun değil",
      provider: "Öneri",
      quality: "N/A",
      speed: "N/A",
      free: true,
      freeNote: "Replicate veya Fal.ai kullanın",
      note: "💡 Hugging Face Inference API text-to-video modellerini desteklemiyor. Replicate veya Fal.ai kullanmanızı öneririz.",
    },
  ],
};

interface VideoModelSelectorProps {
  selectedProvider: VideoProvider;
  selectedModel?: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export default function VideoModelSelector({
  selectedProvider,
  selectedModel,
  onModelChange,
  disabled = false,
}: VideoModelSelectorProps) {
  const availableModels = VIDEO_MODELS[selectedProvider] || VIDEO_MODELS.replicate;
  const currentModel = availableModels.find((m) => m.id === selectedModel) || availableModels[0];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Video Modeli
      </label>
      <select
        value={selectedModel || availableModels[0].id}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {availableModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} - {model.description}
          </option>
        ))}
      </select>
      
      {currentModel && (
        <div className="mt-2 p-3 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-xs text-gray-800 dark:text-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm text-purple-900 dark:text-purple-200">
                {currentModel.name}
              </p>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                {currentModel.provider}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {currentModel.description}
            </p>
            {currentModel.note && (
              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-red-800 dark:text-red-200 text-xs font-medium">
                  {currentModel.note}
                </p>
              </div>
            )}
            
            {selectedProvider === "huggingface" && (
              <div className="mb-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                <p className="text-orange-800 dark:text-orange-200 text-xs font-medium">
                  ⚠️ <strong>Önemli:</strong> Hugging Face Inference API text-to-video modellerini desteklemiyor. 
                  Video oluşturmak için <strong>Replicate</strong> veya <strong>Fal.ai</strong> provider'ını kullanmanızı öneririz.
                </p>
              </div>
            )}
            <div className="flex gap-4 pt-2 border-t border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400">Kalite:</span>
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  {currentModel.quality}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400">Hız:</span>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {currentModel.speed}
                </span>
              </div>
            </div>
            {currentModel.free && (
              <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                  ✅ {currentModel.freeNote}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
