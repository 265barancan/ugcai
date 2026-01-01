"use client";

import { useState, useEffect } from "react";
import { VideoHistoryItem } from "@/types";
import { getVideoHistory } from "@/lib/videoHistory";

interface VideoMergerProps {
  onClose?: () => void;
}

export default function VideoMerger({ onClose }: VideoMergerProps) {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [availableVideos, setAvailableVideos] = useState<VideoHistoryItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load available videos from history
    const history = getVideoHistory();
    setAvailableVideos(history);
  }, []);

  const handleToggleVideo = (videoId: string) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleMerge = async () => {
    if (selectedVideos.length < 2) {
      alert("En az 2 video seçmelisiniz");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const videoUrls = selectedVideos
        .map((id) => {
          const video = availableVideos.find((v) => v.id === id);
          return video?.videoUrl;
        })
        .filter(Boolean) as string[];

      const response = await fetch("/api/merge-videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrls,
        }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        setMergedVideoUrl(data.videoUrl);
      } else {
        alert("Videolar birleştirilemedi: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (error: any) {
      console.error("Error merging videos:", error);
      alert("Videolar birleştirilirken bir hata oluştu: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedVideoUrl) return;

    const link = document.createElement("a");
    link.href = mergedVideoUrl;
    link.download = `merged-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Video Birleştirici
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Kapat
          </button>
        )}
      </div>

      {/* Video Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Birleştirilecek Videolar ({selectedVideos.length} seçili)
        </h3>
        {availableVideos.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              Henüz video geçmişi yok. Önce bir video oluşturun.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {availableVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleToggleVideo(video.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedVideos.includes(video.id)
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                }`}
              >
                <div className="relative aspect-video bg-black rounded mb-2">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.text.substring(0, 30)}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      📹
                    </div>
                  )}
                  {selectedVideos.includes(video.id) && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                      ✓
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {video.text.substring(0, 50)}...
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Merge Button */}
      <div className="flex gap-2">
        <button
          onClick={handleMerge}
          disabled={processing || selectedVideos.length < 2}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {processing ? `Birleştiriliyor... ${Math.round(progress)}%` : "Videoları Birleştir"}
        </button>
        {mergedVideoUrl && (
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            📥 Birleştirilmiş Videoyu İndir
          </button>
        )}
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

      {/* Merged Video Preview */}
      {mergedVideoUrl && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
            Birleştirilmiş Video
          </h4>
          <video
            src={mergedVideoUrl}
            controls
            className="w-full rounded-lg"
          >
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 İpucu:</strong> Videolar seçtiğiniz sırayla birleştirilir. 
          Sırayı değiştirmek için videoları tekrar seçip seçimi kaldırın ve istediğiniz sırayla seçin.
        </p>
      </div>
    </div>
  );
}
