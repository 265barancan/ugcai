"use client";

import { useState, useEffect } from "react";
import { WatermarkOptions, WatermarkPosition, WatermarkType } from "@/types";
import { createWatermarkPreview } from "@/lib/watermark";
import { useToast } from "./ToastContainer";

interface WatermarkEditorProps {
  videoUrl: string;
  onSave: (options: WatermarkOptions) => void;
  onCancel: () => void;
}

export default function WatermarkEditor({ videoUrl, onSave, onCancel }: WatermarkEditorProps) {
  const [options, setOptions] = useState<WatermarkOptions>({
    enabled: false,
    type: "text",
    text: "AI UGC Video",
    position: "bottom-right",
    opacity: 0.7,
    size: 15,
    margin: 20,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (options.enabled) {
      loadPreview();
    } else {
      setPreview(null);
    }
  }, [options, videoUrl]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const previewUrl = await createWatermarkPreview(videoUrl, options, 0);
      setPreview(previewUrl);
    } catch (err: any) {
      showError(err.message || "Preview oluşturulamadı");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Lütfen bir görsel dosyası seçin");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setOptions({ ...options, imageUrl, type: "image" });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (options.enabled && options.type === "text" && !options.text?.trim()) {
      showError("Watermark metni gerekli");
      return;
    }
    if (options.enabled && options.type === "image" && !options.imageUrl) {
      showError("Watermark görseli gerekli");
      return;
    }
    onSave(options);
    success("Watermark ayarları kaydedildi");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Watermark Ayarları
      </h2>

      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enable-watermark"
            checked={options.enabled}
            onChange={(e) => setOptions({ ...options, enabled: e.target.checked })}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="enable-watermark" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Watermark&apos;i Etkinleştir
          </label>
        </div>

        {options.enabled && (
          <>
            {/* Watermark Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Watermark Tipi
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, type: "text" })}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    options.type === "text"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Metin
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, type: "image" })}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    options.type === "image"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Görsel
                </button>
              </div>
            </div>

            {/* Text Watermark */}
            {options.type === "text" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Watermark Metni
                </label>
                <input
                  type="text"
                  value={options.text || ""}
                  onChange={(e) => setOptions({ ...options, text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Watermark metni"
                />
              </div>
            )}

            {/* Image Watermark */}
            {options.type === "image" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Watermark Görseli
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {options.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={options.imageUrl}
                      alt="Watermark preview"
                      className="max-w-xs h-auto border border-gray-300 dark:border-gray-600 rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pozisyon
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["top-left", "top-right", "center", "bottom-left", "bottom-right"] as WatermarkPosition[]).map((position) => (
                  <button
                    key={position}
                    type="button"
                    onClick={() => setOptions({ ...options, position })}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      options.position === position
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {position === "top-left" && "Sol Üst"}
                    {position === "top-right" && "Sağ Üst"}
                    {position === "center" && "Orta"}
                    {position === "bottom-left" && "Sol Alt"}
                    {position === "bottom-right" && "Sağ Alt"}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Şeffaflık: {Math.round(options.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={options.opacity}
                onChange={(e) => setOptions({ ...options, opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Boyut: {options.size}%
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={options.size}
                onChange={(e) => setOptions({ ...options, size: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Margin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kenar Boşluğu: {options.margin}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={options.margin}
                onChange={(e) => setOptions({ ...options, margin: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Preview */}
            {loadingPreview ? (
              <div className="p-8 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                <div className="text-gray-500 dark:text-gray-400">Preview yükleniyor...</div>
              </div>
            ) : preview ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Önizleme
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Watermark preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

