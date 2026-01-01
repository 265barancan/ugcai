"use client";

import { useState, useRef } from "react";

interface VideoEditorProps {
  videoUrl: string;
  onSave?: (editedUrl: string, edits: VideoEdits) => void;
  onCancel?: () => void;
}

export interface VideoEdits {
  trim?: { start: number; end?: number };
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: 90 | 180 | 270;
}

export default function VideoEditor({
  videoUrl,
  onSave,
  onCancel,
}: VideoEditorProps) {
  const [edits, setEdits] = useState<VideoEdits>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTrim, setShowTrim] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleTrim = async () => {
    if (!edits.trim || edits.trim.start < 0) {
      alert("Geçerli bir başlangıç zamanı girin");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const response = await fetch("/api/trim-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          startTime: edits.trim.start,
          endTime: edits.trim.end,
        }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        setPreviewUrl(data.videoUrl);
      } else {
        alert("Video kırpılamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (error: any) {
      console.error("Error trimming video:", error);
      alert("Video kırpılırken bir hata oluştu: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCrop = async () => {
    if (!edits.crop || edits.crop.width <= 0 || edits.crop.height <= 0) {
      alert("Geçerli bir kırpma alanı belirleyin");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const response = await fetch("/api/crop-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          x: edits.crop.x,
          y: edits.crop.y,
          width: edits.crop.width,
          height: edits.crop.height,
        }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        setPreviewUrl(data.videoUrl);
      } else {
        alert("Video kırpılamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (error: any) {
      console.error("Error cropping video:", error);
      alert("Video kırpılırken bir hata oluştu: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRotate = async () => {
    if (!edits.rotate) {
      alert("Döndürme açısı seçin");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const response = await fetch("/api/rotate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          angle: edits.rotate,
        }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        setPreviewUrl(data.videoUrl);
      } else {
        alert("Video döndürülemedi: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (error: any) {
      console.error("Error rotating video:", error);
      alert("Video döndürülürken bir hata oluştu: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = () => {
    if (onSave && previewUrl) {
      onSave(previewUrl, edits);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Video Düzenleyici
        </h2>
        <div className="flex gap-2">
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

      {/* Video Preview */}
      <div className="mb-6">
        <video
          ref={videoRef}
          src={previewUrl || videoUrl}
          controls
          className="w-full rounded-lg"
          onLoadedMetadata={handleVideoLoaded}
        >
          Tarayıcınız video oynatmayı desteklemiyor.
        </video>
        {videoDuration > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Süre: {formatTime(videoDuration)}
          </p>
        )}
      </div>

      {/* Trim */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ✂️ Kırp (Trim)
          </h3>
          <button
            onClick={() => setShowTrim(!showTrim)}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            {showTrim ? "Gizle" : "Göster"}
          </button>
        </div>
        {showTrim && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Başlangıç (saniye)
                </label>
                <input
                  type="number"
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  value={edits.trim?.start || 0}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      trim: {
                        ...edits.trim,
                        start: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bitiş (saniye) - Opsiyonel
                </label>
                <input
                  type="number"
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  value={edits.trim?.end || ""}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      trim: {
                        ...edits.trim,
                        end: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Boş bırak = sona kadar"
                />
              </div>
            </div>
            <button
              onClick={handleTrim}
              disabled={processing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {processing ? `İşleniyor... ${Math.round(progress)}%` : "Kırp"}
            </button>
          </div>
        )}
      </div>

      {/* Crop */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🖼️ Kırp (Crop)
          </h3>
          <button
            onClick={() => setShowCrop(!showCrop)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            {showCrop ? "Gizle" : "Göster"}
          </button>
        </div>
        {showCrop && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  X Pozisyonu
                </label>
                <input
                  type="number"
                  min="0"
                  value={edits.crop?.x || 0}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      crop: {
                        ...edits.crop,
                        x: Number(e.target.value),
                        width: edits.crop?.width || 640,
                        height: edits.crop?.height || 360,
                        y: edits.crop?.y || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Y Pozisyonu
                </label>
                <input
                  type="number"
                  min="0"
                  value={edits.crop?.y || 0}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      crop: {
                        ...edits.crop,
                        y: Number(e.target.value),
                        width: edits.crop?.width || 640,
                        height: edits.crop?.height || 360,
                        x: edits.crop?.x || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genişlik
                </label>
                <input
                  type="number"
                  min="1"
                  value={edits.crop?.width || 640}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      crop: {
                        ...edits.crop,
                        width: Number(e.target.value),
                        height: edits.crop?.height || 360,
                        x: edits.crop?.x || 0,
                        y: edits.crop?.y || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yükseklik
                </label>
                <input
                  type="number"
                  min="1"
                  value={edits.crop?.height || 360}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      crop: {
                        ...edits.crop,
                        height: Number(e.target.value),
                        width: edits.crop?.width || 640,
                        x: edits.crop?.x || 0,
                        y: edits.crop?.y || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={handleCrop}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {processing ? `İşleniyor... ${Math.round(progress)}%` : "Kırp"}
            </button>
          </div>
        )}
      </div>

      {/* Rotate */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔄 Döndür
        </h3>
        <div className="flex gap-2 mb-4">
          {[90, 180, 270].map((angle) => (
            <button
              key={angle}
              onClick={() => setEdits({ ...edits, rotate: angle as 90 | 180 | 270 })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                edits.rotate === angle
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
              }`}
            >
              {angle}°
            </button>
          ))}
        </div>
        <button
          onClick={handleRotate}
          disabled={processing || !edits.rotate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {processing ? `İşleniyor... ${Math.round(progress)}%` : "Döndür"}
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
    </div>
  );
}
