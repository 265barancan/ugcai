"use client";

import { useState } from "react";
import VideoGenerator from "./components/VideoGenerator";
import DashboardWidgets from "./components/DashboardWidgets";

export default function Home() {
  const [quickAction, setQuickAction] = useState<"new-video" | "batch" | "history" | "analytics" | "avatar" | "image" | "outfit" | "merge" | "collections" | undefined>(undefined);

  const handleQuickAction = (action: "new-video" | "batch" | "history" | "analytics" | "avatar" | "image" | "outfit" | "merge" | "collections") => {
    console.log("handleQuickAction called with:", action);
    // Set action with timestamp to ensure it's always a new value
    setQuickAction(`${action}-${Date.now()}` as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              AI Destekli İçerik Üretim Platformu
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                AI UGC Video
              </span>
              <br />
              Generator
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Metninizi girin, AI ile profesyonel influencer videoları, görseller ve avatar'lar oluşturun. 
              <span className="text-purple-600 dark:text-purple-400 font-semibold"> Tek tıkla içerik üretin.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Hızlı Üretim</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Yüksek Kalite</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Kolay Kullanım</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <DashboardWidgets onQuickAction={handleQuickAction} />
      </div>

      {/* Only show VideoGenerator when an action is selected */}
      {quickAction && (
        <VideoGenerator 
          initialAction={quickAction} 
          onClose={() => setQuickAction(undefined)}
        />
      )}
    </div>
  );
}
