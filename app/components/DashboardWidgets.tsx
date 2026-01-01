"use client";

import { useState, useEffect } from "react";
import { VideoHistoryItem } from "@/types";
import { getVideoHistory } from "@/lib/videoHistory";
import { calculateAnalytics, formatDuration, formatStorage } from "@/lib/analytics";
import Link from "next/link";

interface DashboardWidgetsProps {
  onQuickAction?: (action: "new-video" | "batch" | "history" | "analytics" | "avatar" | "image" | "outfit" | "merge" | "collections" | "jewelry") => void;
}

export default function DashboardWidgets({ onQuickAction }: DashboardWidgetsProps) {
  const [recentVideos, setRecentVideos] = useState<VideoHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const history = getVideoHistory();
    setRecentVideos(history.slice(0, 5)); // Last 5 videos

    const analyticsData = calculateAnalytics();
    setAnalytics(analyticsData);
  }, []);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Toplam Video</h3>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <span className="text-2xl">📹</span>
              </div>
            </div>
            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
              {analytics?.totalVideos || 0}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {analytics?.totalDuration ? formatDuration(analytics.totalDuration) : "0s"} toplam süre
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Depolama</h3>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <span className="text-2xl">💾</span>
              </div>
            </div>
            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              {analytics?.totalStorage ? formatStorage(analytics.totalStorage) : "0 B"}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tahmini kullanım</p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Başarı Oranı</h3>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <span className="text-2xl">✓</span>
              </div>
            </div>
            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
              {analytics?.successRate?.toFixed(1) || "100"}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Video oluşturma başarısı</p>
          </div>
        </div>
      </div>

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Son Videolar
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Son oluşturduğunuz içerikler</p>
            </div>
            <button
              type="button"
              onClick={() => {
                console.log("View all history button clicked");
                onQuickAction?.("history");
              }}
              className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
                <div className="relative">
                  {video.thumbnail ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-gray-700">
                      <img
                        src={video.thumbnail}
                        alt={video.text.substring(0, 30)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">📹</span>
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                    {video.text.substring(0, 60)}...
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(video.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    <a
                      href={video.videoUrl}
                      download
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      İndir
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Hızlı Erişim
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tüm araçlara tek tıkla erişin</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => {
              console.log("New video button clicked");
              onQuickAction?.("new-video");
            }}
            className="group relative p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all duration-300 text-center cursor-pointer border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎬</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Yeni Video
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Metinden AI videoları oluştur
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Avatar button clicked");
              onQuickAction?.("avatar");
            }}
            className="group relative p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl hover:from-pink-100 hover:to-pink-200 dark:hover:from-pink-900/30 dark:hover:to-pink-800/30 transition-all duration-300 text-center cursor-pointer border border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">👤</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Avatar
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              AI ile karakter avatar'ı oluştur
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Image button clicked");
              onQuickAction?.("image");
            }}
            className="group relative p-6 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-xl hover:from-rose-100 hover:to-rose-200 dark:hover:from-rose-900/30 dark:hover:to-rose-800/30 transition-all duration-300 text-center cursor-pointer border border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🖼️</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Görsel
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              AI ile görsel üret ve poz varyasyonları oluştur
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Outfit button clicked");
              onQuickAction?.("outfit");
            }}
            className="group relative p-6 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-900/20 dark:to-fuchsia-800/20 rounded-xl hover:from-fuchsia-100 hover:to-fuchsia-200 dark:hover:from-fuchsia-900/30 dark:hover:to-fuchsia-800/30 transition-all duration-300 text-center cursor-pointer border border-fuchsia-200 dark:border-fuchsia-800 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">👗</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Kıyafet
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Karaktere kıyafet giydir
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Merge button clicked");
              onQuickAction?.("merge");
            }}
            className="group relative p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-300 text-center cursor-pointer border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🔗</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Birleştir
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Birden fazla videoyu birleştir
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Collections button clicked");
              onQuickAction?.("collections");
            }}
            className="group relative p-6 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-xl hover:from-violet-100 hover:to-violet-200 dark:hover:from-violet-900/30 dark:hover:to-violet-800/30 transition-all duration-300 text-center cursor-pointer border border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📁</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Koleksiyonlar
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Videolarınızı organize edin
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Batch button clicked");
              onQuickAction?.("batch");
            }}
            className="group relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-300 text-center cursor-pointer border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📦</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Toplu İşlem
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Çoklu video toplu üret
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("History button clicked");
              onQuickAction?.("history");
            }}
            className="group relative p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-300 text-center cursor-pointer border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📚</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Geçmiş
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Oluşturduğunuz videoları görüntüle
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Analytics button clicked");
              onQuickAction?.("analytics");
            }}
            className="group relative p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-all duration-300 text-center cursor-pointer border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Analytics
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              İstatistikleri ve analizleri görüntüle
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Jewelry button clicked");
              onQuickAction?.("jewelry");
            }}
            className="group relative p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-900/30 dark:hover:to-amber-800/30 transition-all duration-300 text-center cursor-pointer border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">💎</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Takı
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Avatar'a takı ekle ve düzenle
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

