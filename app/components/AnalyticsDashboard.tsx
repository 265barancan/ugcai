"use client";

import { useState, useEffect } from "react";
import { AnalyticsData } from "@/types";
import { calculateAnalytics, formatDuration, formatStorage } from "@/lib/analytics";
import { VIDEO_PROVIDERS } from "@/lib/videoProviders";

interface AnalyticsDashboardProps {
  onClose?: () => void;
}

export default function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate analytics on mount and when data changes
    const data = calculateAnalytics();
    setAnalytics(data);
    setLoading(false);

    // Refresh analytics every 5 seconds
    const interval = setInterval(() => {
      const newData = calculateAnalytics();
      setAnalytics(newData);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  const maxVideos = Math.max(...analytics.videosByDay.map((d) => d.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Analytics Dashboard
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90 mb-1">Toplam Video</div>
          <div className="text-3xl font-bold">{analytics.totalVideos}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90 mb-1">Toplam Süre</div>
          <div className="text-3xl font-bold">{formatDuration(analytics.totalDuration)}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90 mb-1">Tahmini Depolama</div>
          <div className="text-3xl font-bold">{formatStorage(analytics.totalStorage)}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90 mb-1">Başarı Oranı</div>
          <div className="text-3xl font-bold">{analytics.successRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Videos by Day Chart */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Son 30 Gün - Video Sayısı
          </h3>
          <div className="space-y-2">
            {analytics.videosByDay.slice(-7).map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString("tr-TR", { weekday: "short" });
              const dayNumber = date.getDate();
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-gray-600 dark:text-gray-400">
                    {dayName} {dayNumber}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(day.count / maxVideos) * 100}%`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                      {day.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Videos by Provider */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Provider Dağılımı
          </h3>
          <div className="space-y-3">
            {analytics.videosByProvider.map((provider, index) => {
              const providerConfig = VIDEO_PROVIDERS.find(
                (p) => p.provider === provider.provider
              );
              const percentage = analytics.totalVideos > 0
                ? (provider.count / analytics.totalVideos) * 100
                : 0;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>{providerConfig?.icon || "📹"}</span>
                    <span className="font-medium">{providerConfig?.name || provider.provider}</span>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                      {provider.count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Ortalama Oluşturma Süresi
          </h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.averageGenerationTime}s
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tahmini süre (gerçek süreler için tracking gerekli)
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Son 30 Gün Toplam
          </h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.last30Days.reduce((sum, day) => sum + day.videos, 0)} video
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatDuration(
              analytics.last30Days.reduce((sum, day) => sum + day.duration, 0)
            )} toplam süre
          </p>
        </div>
      </div>
    </div>
  );
}

