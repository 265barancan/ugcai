"use client";

import { useState, useEffect } from "react";
import { VideoHistoryItem } from "@/types";
import {
  getVideoHistory,
  getFavoriteVideos,
  toggleFavorite,
  deleteVideoFromHistory,
  clearVideoHistory,
} from "@/lib/videoHistory";

interface VideoHistoryProps {
  onSelectVideo?: (video: VideoHistoryItem) => void;
  onClose?: () => void;
}

export default function VideoHistory({ onSelectVideo, onClose }: VideoHistoryProps) {
  const [allVideos, setAllVideos] = useState<VideoHistoryItem[]>([]);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "duration">("date");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [filter]);

  useEffect(() => {
    // Filter and sort videos based on search, date filter, and sort options
    let filtered = [...allVideos];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (video) =>
          video.text.toLowerCase().includes(query) ||
          video.voiceName?.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;

      filtered = filtered.filter((video) => {
        const diff = now - video.createdAt;
        switch (dateFilter) {
          case "today":
            return diff < oneDay;
          case "week":
            return diff < oneWeek;
          case "month":
            return diff < oneMonth;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.createdAt - a.createdAt; // Newest first
        case "name":
          return a.text.localeCompare(b.text);
        case "duration":
          // Sort by video settings duration if available
          const aDuration = a.settings?.duration || 0;
          const bDuration = b.settings?.duration || 0;
          return bDuration - aDuration;
        default:
          return 0;
      }
    });

    setHistory(filtered);
  }, [allVideos, searchQuery, dateFilter, sortBy]);

  const loadHistory = () => {
    const videos = filter === "favorites" ? getFavoriteVideos() : getVideoHistory();
    setAllVideos(videos);
    setHistory(videos);
  };

  const handleToggleFavorite = (videoId: string) => {
    toggleFavorite(videoId);
    loadHistory();
  };

  const handleDelete = (videoId: string) => {
    if (showDeleteConfirm === videoId) {
      deleteVideoFromHistory(videoId);
      loadHistory();
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(videoId);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };

  const handleClearAll = () => {
    if (confirm("Tüm geçmişi silmek istediğinizden emin misiniz?")) {
      clearVideoHistory();
      loadHistory();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Bugün";
    } else if (days === 1) {
      return "Dün";
    } else if (days < 7) {
      return `${days} gün önce`;
    } else {
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Video Geçmişi
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter(filter === "all" ? "favorites" : "all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "favorites"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {filter === "favorites" ? "⭐ Favoriler" : "📋 Tümü"}
            </button>
            {allVideos.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
              >
                Tümünü Sil
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
              >
                Kapat
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔍 Arama
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Video metni veya ses adı ile ara..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📅 Tarih Filtresi
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔄 Sıralama
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="date">Tarihe Göre (Yeni → Eski)</option>
                <option value="name">İsme Göre (A → Z)</option>
                <option value="duration">Süreye Göre (Uzun → Kısa)</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {history.length} video bulundu {searchQuery && `(arama: "${searchQuery}")`}
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === "favorites"
              ? "Henüz favori video yok"
              : "Henüz video geçmişi yok"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((video) => (
            <div
              key={video.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Video Thumbnail/Preview */}
              <div className="relative aspect-video bg-black">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.text.substring(0, 30)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    onLoadedData={(e) => {
                      // Try to generate thumbnail on load
                      const video = e.currentTarget;
                      video.currentTime = 1; // Seek to 1 second
                    }}
                  />
                )}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleToggleFavorite(video.id)}
                    className={`p-2 rounded-full backdrop-blur-sm ${
                      video.isFavorite
                        ? "bg-yellow-500 text-white"
                        : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                    title={video.isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
                  >
                    ⭐
                  </button>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {video.text}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                  <span>{formatDate(video.createdAt)}</span>
                  {video.voiceName && (
                    <span className="truncate ml-2">{video.voiceName}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {onSelectVideo && (
                    <button
                      onClick={() => onSelectVideo(video)}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                    >
                      Görüntüle
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(video.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showDeleteConfirm === video.id
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20"
                    }`}
                  >
                    {showDeleteConfirm === video.id ? "Onayla" : "🗑️"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

