"use client";

import { useState } from "react";
import { ExportOptions, ExportFormat, ExportQuality, ExportFrameRate } from "@/types";
import { downloadVideo, generateExportFilename, getExportExtension } from "@/lib/videoExport";
import { exportVideo as ffmpegExportVideo } from "@/lib/ffmpeg";
import { useToast } from "./ToastContainer";

interface VideoExporterProps {
  videoUrl: string;
  videoTitle?: string;
  onClose?: () => void;
}

export default function VideoExporter({ videoUrl, videoTitle = "video", onClose }: VideoExporterProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "mp4",
    quality: "high",
    frameRate: 30,
  });
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const { success, error: showError, info } = useToast();

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    setExportUrl(null);

    try {
      info("FFmpeg yükleniyor... Bu ilk kullanımda biraz zaman alabilir.");

      // Map quality from ExportQuality to ffmpeg quality
      const qualityMap: Record<ExportQuality, "low" | "medium" | "high"> = {
        low: "low",
        medium: "medium",
        high: "high",
        original: "high", // Use high quality for original
      };

      // Use FFmpeg to export video
      const blob = await ffmpegExportVideo(
        videoUrl,
        {
          format: exportOptions.format,
          quality: qualityMap[exportOptions.quality],
          frameRate: exportOptions.frameRate,
        },
        (progress) => {
          setExportProgress(Math.min(progress, 99));
        }
      );

      setExportProgress(100);

      // Create object URL from blob
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      success("Video başarıyla export edildi!");

      // Auto-download if user wants
      const filename = generateExportFilename(
        videoTitle,
        exportOptions.format,
        exportOptions.quality
      );
      downloadVideo(url, filename);
    } catch (err: any) {
      showError(err.message || "Video export edilemedi");
    } finally {
      setExporting(false);
      if (exportProgress < 100) {
        setExportProgress(0);
      }
    }
  };

  const handleDownload = () => {
    if (!exportUrl) {
      // Fallback to original video
      const filename = generateExportFilename(
        videoTitle,
        exportOptions.format,
        exportOptions.quality
      );
      downloadVideo(videoUrl, filename);
      success("Video indiriliyor...");
    } else {
      const filename = generateExportFilename(
        videoTitle,
        exportOptions.format,
        exportOptions.quality
      );
      downloadVideo(exportUrl, filename);
      success("Export edilmiş video indiriliyor...");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Video Export
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ✕ Kapat
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["mp4", "webm", "gif"] as ExportFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => setExportOptions({ ...exportOptions, format })}
                disabled={exporting}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  exportOptions.format === format
                    ? "bg-purple-600 text-white shadow-md border-2 border-purple-700"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border-2 border-gray-300 dark:border-gray-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kalite
          </label>
          <div className="grid grid-cols-4 gap-3">
            {(["low", "medium", "high", "original"] as ExportQuality[]).map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => setExportOptions({ ...exportOptions, quality })}
                disabled={exporting}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all capitalize ${
                  exportOptions.quality === quality
                    ? "bg-purple-600 text-white shadow-md border-2 border-purple-700"
                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border-2 border-gray-300 dark:border-gray-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {quality === "low" && "Düşük"}
                {quality === "medium" && "Orta"}
                {quality === "high" && "Yüksek"}
                {quality === "original" && "Orijinal"}
              </button>
            ))}
          </div>
        </div>

        {/* Frame Rate Selection (only for video formats) */}
        {exportOptions.format !== "gif" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frame Rate (FPS)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([24, 30, 60] as ExportFrameRate[]).map((fps) => (
                <button
                  key={fps}
                  type="button"
                  onClick={() => setExportOptions({ ...exportOptions, frameRate: fps })}
                  disabled={exporting}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    exportOptions.frameRate === fps
                      ? "bg-purple-600 text-white shadow-md border-2 border-purple-700"
                      : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border-2 border-gray-300 dark:border-gray-500"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Export Progress */}
        {exporting && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Video export ediliyor...
              </span>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {Math.round(exportProgress)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            {exportProgress < 10 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                FFmpeg yükleniyor... İlk kullanımda bu işlem biraz zaman alabilir.
              </p>
            )}
          </div>
        )}

        {/* Export Info */}
        {!exporting && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Not:</strong> Video export işlemi tarayıcınızda gerçekleştirilir.
              İlk kullanımda FFmpeg yükleneceği için biraz zaman alabilir.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Export Ediliyor... ({Math.round(exportProgress)}%)</span>
              </>
            ) : (
              "Export Et"
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📥 İndir
          </button>
        </div>

        {exportUrl && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Video başarıyla export edildi!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

