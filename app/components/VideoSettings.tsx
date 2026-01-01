"use client";

import { VideoSettings as VideoSettingsType } from "@/types";

interface VideoSettingsProps {
  settings: VideoSettingsType;
  onSettingsChange: (settings: VideoSettingsType) => void;
  disabled?: boolean;
}

export default function VideoSettings({
  settings,
  onSettingsChange,
  disabled = false,
}: VideoSettingsProps) {
  const handleDurationChange = (duration: number) => {
    onSettingsChange({ ...settings, duration });
  };

  const handleResolutionChange = (resolution: "720p" | "1080p" | "4K") => {
    onSettingsChange({ ...settings, resolution });
  };

  const handleStyleChange = (style: string) => {
    onSettingsChange({ ...settings, style });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Video Ayarları
      </h3>

      {/* Duration Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Video Süresi
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[5, 8, 15, 30].map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => handleDurationChange(duration)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                settings.duration === duration
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {duration}s
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Çözünürlük
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["720p", "1080p", "4K"] as const).map((resolution) => (
            <button
              key={resolution}
              type="button"
              onClick={() => handleResolutionChange(resolution)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                settings.resolution === resolution
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {resolution}
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Video Stili
        </label>
        <select
          value={settings.style}
          onChange={(e) => handleStyleChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="professional">Profesyonel</option>
          <option value="friendly">Samimi</option>
          <option value="energetic">Enerjik</option>
          <option value="calm">Sakin</option>
          <option value="dramatic">Dramatik</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Video stili, oluşturulan videonun genel atmosferini etkiler
        </p>
      </div>
    </div>
  );
}

