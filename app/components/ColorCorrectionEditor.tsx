"use client";

import { useState } from "react";

interface ColorCorrectionEditorProps {
  videoUrl: string;
  onSave?: (correctedUrl: string, options: ColorCorrectionOptions) => void;
  onCancel?: () => void;
}

export interface ColorCorrectionOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  exposure?: number;
  temperature?: number;
  tint?: number;
  shadows?: number;
  highlights?: number;
  gamma?: number;
}

export default function ColorCorrectionEditor({
  videoUrl,
  onSave,
  onCancel,
}: ColorCorrectionEditorProps) {
  const [options, setOptions] = useState<ColorCorrectionOptions>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleApply = async () => {
    setProcessing(true);
    setProgress(0);

    try {
      const response = await fetch("/api/color-correction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          options,
        }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        setPreviewUrl(data.videoUrl);
      } else {
        alert("Renk düzeltmesi uygulanamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (error: any) {
      console.error("Error applying color correction:", error);
      alert("Renk düzeltmesi uygulanırken bir hata oluştu: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setOptions({});
    setPreviewUrl(null);
  };

  const handleSave = () => {
    if (onSave && previewUrl) {
      onSave(previewUrl, options);
    }
  };

  const colorControls = [
    {
      key: "brightness" as const,
      name: "Parlaklık",
      icon: "☀️",
      description: "Genel parlaklık seviyesi",
    },
    {
      key: "contrast" as const,
      name: "Kontrast",
      icon: "🎨",
      description: "Siyah-beyaz arasındaki fark",
    },
    {
      key: "saturation" as const,
      name: "Doygunluk",
      icon: "🌈",
      description: "Renklerin canlılığı",
    },
    {
      key: "exposure" as const,
      name: "Pozlama",
      icon: "📸",
      description: "Işık seviyesi",
    },
    {
      key: "temperature" as const,
      name: "Sıcaklık",
      icon: "🌡️",
      description: "Soğuk (mavi) ↔ Sıcak (turuncu)",
    },
    {
      key: "tint" as const,
      name: "Ton",
      icon: "🎭",
      description: "Yeşil ↔ Magenta",
    },
    {
      key: "shadows" as const,
      name: "Gölgeler",
      icon: "🌑",
      description: "Karanlık alanların parlaklığı",
    },
    {
      key: "highlights" as const,
      name: "Vurgular",
      icon: "✨",
      description: "Aydınlık alanların parlaklığı",
    },
    {
      key: "gamma" as const,
      name: "Gamma",
      icon: "📊",
      description: "Orta tonların parlaklığı",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Renk Düzeltme (Color Grading)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Sıfırla
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
          )}
          {onSave && previewUrl && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Kaydet
            </button>
          )}
        </div>
      </div>

      {/* Color Controls */}
      <div className="space-y-6">
        {colorControls.map((control) => (
          <div key={control.key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{control.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {control.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {control.description}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {options[control.key] !== undefined ? options[control.key] : 0}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={options[control.key] || 0}
              onChange={(e) =>
                setOptions({
                  ...options,
                  [control.key]: Number(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>-100</span>
              <span>0</span>
              <span>+100</span>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Button */}
      <div className="mt-6">
        <button
          onClick={handleApply}
          disabled={processing}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {processing ? `Uygulanıyor... ${Math.round(progress)}%` : "Renk Düzeltmesini Uygula"}
        </button>
      </div>

      {/* Progress */}
      {processing && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
            Önizleme
          </h4>
          <video
            src={previewUrl}
            controls
            className="w-full rounded-lg"
          >
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        </div>
      )}

      {/* Presets */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Hazır Ayarlar
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              name: "Vintage",
              options: { saturation: -30, temperature: 20, contrast: 10 },
            },
            {
              name: "Dramatik",
              options: { contrast: 30, saturation: 20, shadows: -20, highlights: 20 },
            },
            {
              name: "Canlı",
              options: { saturation: 40, brightness: 10, contrast: 15 },
            },
            {
              name: "Siyah-Beyaz",
              options: { saturation: -100 },
            },
            {
              name: "Soğuk",
              options: { temperature: -30, saturation: -10 },
            },
            {
              name: "Sıcak",
              options: { temperature: 30, saturation: 10 },
            },
            {
              name: "Yumuşak",
              options: { contrast: -20, saturation: -10, highlights: -10 },
            },
            {
              name: "Keskin",
              options: { contrast: 40, saturation: 20, brightness: 5 },
            },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setOptions(preset.options);
                setPreviewUrl(null);
              }}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
