"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "./ToastContainer";
import { AvatarGenerationOptions } from "@/lib/huggingface";
import LoadingState from "./LoadingState";
import { saveAvatar, getAllAvatars } from "@/lib/avatarHistory";

// En iyi ücretsiz AI görsel modelleri (sansürsüz alternatifler dahil)
const AVAILABLE_MODELS = [
  {
    id: "black-forest-labs/FLUX.1-dev",
    name: "FLUX.1-dev",
    description: "En yüksek kalite - 12B parametre, estetik fotoğraflar, daha az kısıtlı",
    provider: "Black Forest Labs",
    quality: "Çok Yüksek",
    speed: "Orta",
    uncensored: true,
    nsfw: true,
  },
  {
    id: "black-forest-labs/FLUX.1-schnell",
    name: "FLUX.1-schnell",
    description: "Hızlı üretim - Apache 2.0 lisanslı, daha az kısıtlı",
    provider: "Black Forest Labs",
    quality: "İyi",
    speed: "Çok Hızlı",
    uncensored: true,
    nsfw: true,
  },
  {
    id: "SG161222/Realistic_Vision_V6.0_B1_noVAE",
    name: "Realistic Vision V6.0",
    description: "Gerçekçi fotoğraflar - NSFW destekli, yüksek kalite",
    provider: "SG161222",
    quality: "Çok Yüksek",
    speed: "Orta",
    uncensored: true,
    nsfw: true,
  },
  {
    id: "SG161222/Realistic_Vision_V5.1_noVAE",
    name: "Realistic Vision V5.1",
    description: "Gerçekçi fotoğraflar - NSFW destekli, kararlı versiyon",
    provider: "SG161222",
    quality: "Yüksek",
    speed: "Orta",
    uncensored: true,
    nsfw: true,
  },
  {
    id: "runwayml/stable-diffusion-v1-5",
    name: "Stable Diffusion v1.5",
    description: "Klasik ve hızlı - geniş kullanım alanı, NSFW destekli",
    provider: "Runway",
    quality: "İyi",
    speed: "Hızlı",
    uncensored: true,
    nsfw: true,
  },
  {
    id: "CompVis/stable-diffusion-v1-4",
    name: "Stable Diffusion v1.4",
    description: "Orijinal model - NSFW destekli, güvenilir",
    provider: "CompVis",
    quality: "İyi",
    speed: "Hızlı",
    uncensored: true,
    nsfw: true,
  },
  {
    id: "stabilityai/stable-diffusion-xl-base-1.0",
    name: "Stable Diffusion XL",
    description: "Popüler ve güvenilir - yüksek kalite görseller",
    provider: "Stability AI",
    quality: "Yüksek",
    speed: "Orta",
    uncensored: false,
    nsfw: false,
  },
  {
    id: "stabilityai/sdxl-turbo",
    name: "SDXL Turbo",
    description: "Çok hızlı - tek adımda görsel üretimi",
    provider: "Stability AI",
    quality: "İyi",
    speed: "Çok Hızlı",
    uncensored: false,
    nsfw: false,
  },
];

export default function AvatarGenerator() {
  const [prompt, setPrompt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [options, setOptions] = useState<AvatarGenerationOptions>({
    style: "realistic",
    gender: undefined,
    age: undefined,
    additionalPrompt: "",
    model: AVAILABLE_MODELS[0].id,
  });
  const { toasts, removeToast, success, error: showError } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showError("Lütfen bir açıklama girin");
      return;
    }

    setIsGenerating(true);
    setAvatarUrl(null);

    try {
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          options: {
            ...options,
            model: selectedModel,
            additionalPrompt: options.additionalPrompt?.trim() || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Avatar oluşturulamadı");
      }

      setAvatarUrl(data.imageUrl);
      setIsSaved(false); // Reset saved state for new avatar
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      showError(
        error.message || "Avatar oluşturulurken bir hata oluştu"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!avatarUrl) return;

    const link = document.createElement("a");
    link.href = avatarUrl;
    link.download = `avatar-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Avatar indirildi!");
  };

  const handleSave = () => {
    if (!avatarUrl || !prompt.trim()) {
      showError("Kaydetmek için avatar ve açıklama gerekli");
      return;
    }

    try {
      // Check if already saved
      const allAvatars = getAllAvatars();
      const alreadySaved = allAvatars.some(
        (avatar) => avatar.imageUrl === avatarUrl
      );

      if (alreadySaved) {
        success("Bu avatar zaten kaydedilmiş!");
        setIsSaved(true);
        return;
      }

      saveAvatar(avatarUrl, prompt.trim(), selectedModel);
      setIsSaved(true);
      success("Avatar başarıyla kaydedildi! Artık Kıyafet Oluşturucu'da kullanabilirsiniz.");
    } catch (error: any) {
      console.error("Error saving avatar:", error);
      showError(error.message || "Avatar kaydedilirken bir hata oluştu");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Avatar Oluşturucu
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Hugging Face AI kullanarak özel avatar oluşturun
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              AI Modeli Seçin
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {AVAILABLE_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedModel === model.id
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                  } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setSelectedModel(newModel);
                      setOptions({ ...options, model: newModel });
                    }}
                    disabled={isGenerating}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {model.name}
                      </span>
                      {model.uncensored && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded font-medium">
                          ✓ Daha Az Kısıtlı
                        </span>
                      )}
                      {model.nsfw && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs rounded font-medium">
                          🔞 NSFW Destekli
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {model.description}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>Kalite: {model.quality}</span>
                      <span>Hız: {model.speed}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>💡 İpucu:</strong> 🔞 NSFW Destekli modeller (Realistic Vision, FLUX, Stable Diffusion v1.4/v1.5) çıplaklık içeren görseller oluşturmak için uygundur. 
                Hugging Face Inference API üzerinden ücretsiz kullanılabilir (API key ile daha yüksek limitler).
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="avatar-prompt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Avatar Açıklaması
            </label>
            <textarea
              id="avatar-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Örn: Genç bir kadın, kahverengi saçlı, gülümseyen, profesyonel görünüm..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {prompt.length} / 500 karakter
            </p>
          </div>

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stil
            </label>
            <select
              value={options.style}
              onChange={(e) =>
                setOptions({
                  ...options,
                  style: e.target.value as AvatarGenerationOptions["style"],
                })
              }
              disabled={isGenerating}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="realistic">Gerçekçi</option>
              <option value="cartoon">Karikatür</option>
              <option value="anime">Anime</option>
              <option value="professional">Profesyonel</option>
              <option value="artistic">Sanatsal</option>
            </select>
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cinsiyet (Opsiyonel)
            </label>
            <select
              value={options.gender || ""}
              onChange={(e) =>
                setOptions({
                  ...options,
                  gender: e.target.value
                    ? (e.target.value as AvatarGenerationOptions["gender"])
                    : undefined,
                })
              }
              disabled={isGenerating}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Belirtilmemiş</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
              <option value="neutral">Nötr</option>
            </select>
          </div>

          {/* Age Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Yaş (Opsiyonel)
            </label>
            <select
              value={options.age || ""}
              onChange={(e) =>
                setOptions({
                  ...options,
                  age: e.target.value
                    ? (e.target.value as AvatarGenerationOptions["age"])
                    : undefined,
                })
              }
              disabled={isGenerating}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Belirtilmemiş</option>
              <option value="young">Genç</option>
              <option value="adult">Yetişkin</option>
              <option value="elderly">Yaşlı</option>
            </select>
          </div>

          {/* Additional Prompt */}
          <div>
            <label
              htmlFor="additional-prompt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Ek Detaylar (Opsiyonel)
            </label>
            <input
              id="additional-prompt"
              type="text"
              value={options.additionalPrompt || ""}
              onChange={(e) =>
                setOptions({ ...options, additionalPrompt: e.target.value })
              }
              disabled={isGenerating}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Örn: mavi gözler, kısa saç, güneş gözlüğü..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isGenerating ? "Oluşturuluyor..." : "Avatar Oluştur"}
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {isGenerating && (
            <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <LoadingState 
                status={{
                  status: "generating-video",
                  message: "Avatar oluşturuluyor...",
                  progress: undefined,
                }}
              />
            </div>
          )}

          {!isGenerating && avatarUrl && (
            <div className="space-y-4">
              <div className="relative bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                <img
                  src={avatarUrl}
                  alt="Generated avatar"
                  className="w-full h-auto rounded-lg shadow-md"
                />
                {isSaved && (
                  <div className="absolute top-6 right-6 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span>✓</span>
                    <span>Kaydedildi</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`flex-1 font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                    isSaved
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
                  }`}
                >
                  {isSaved ? "✓ Kaydedildi" : "💾 Kaydet"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  📥 İndir
                </button>
              </div>
              {isSaved && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>✓ Başarılı!</strong> Avatar kaydedildi. Artık "Kıyafet Oluşturucu" bölümünde bu karakteri seçip kıyafet giydirebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isGenerating && !avatarUrl && (
            <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 border-dashed">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <svg
                  className="mx-auto h-16 w-16 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <p className="text-lg font-medium">Avatar burada görünecek</p>
                <p className="text-sm mt-2">
                  Yukarıdaki formu doldurup "Avatar Oluştur" butonuna tıklayın
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 İpucu:</strong> Daha iyi sonuçlar için açıklamayı detaylı
          yazın. Örneğin: "Genç bir kadın, kahverengi saçlı, mavi gözler,
          gülümseyen, profesyonel iş kıyafeti, stüdyo ışığı"
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
          <strong>Not:</strong> Hugging Face API key'i .env dosyasına
          HUGGINGFACE_API_KEY olarak eklenebilir (opsiyonel, ücretsiz tier
          kullanılabilir)
        </p>
      </div>
    </div>
  );
}
