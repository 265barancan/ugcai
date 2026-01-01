"use client";

import { useState } from "react";
import AIModelSelector from "./AIModelSelector";
import { AIModel } from "@/types";
import { useToast } from "./ToastContainer";

interface VideoSummaryProps {
  videoText: string;
  videoUrl?: string;
}

export default function VideoSummary({ videoText, videoUrl }: VideoSummaryProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const { success, error: showError } = useToast();

  const handleGenerateSummary = async () => {
    if (!videoText.trim()) {
      showError("Video metni gerekli");
      return;
    }

    setLoading(true);
    setSummary(null);

    try {
      const response = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          type: "video-summary",
          text: videoText,
          videoUrl: videoUrl,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Video özeti oluşturulamadı");
      }

      setSummary(data.result);
      setShowSummary(true);
      success("Video özeti oluşturuldu!");
    } catch (err: any) {
      showError(err.message || "Video özeti oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (!showSummary && !loading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
              📝 Video Özeti Oluştur
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              AI ile video içeriğiniz için özet oluşturun
            </p>
          </div>
          <button
            onClick={() => setShowSummary(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Özet Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-blue-900 dark:text-blue-200">
          📝 Video Özeti
        </h4>
        <button
          onClick={() => {
            setShowSummary(false);
            setSummary(null);
          }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          ✕
        </button>
      </div>

      <AIModelSelector
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        disabled={loading}
      />

      <button
        onClick={handleGenerateSummary}
        disabled={loading || !videoText.trim()}
        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Özet Oluşturuluyor...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>AI ile Özet Oluştur</span>
          </>
        )}
      </button>

      {summary && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Özet:</h5>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

