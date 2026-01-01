"use client";

import { useState, useRef } from "react";
import { BatchVideoJob, BatchVideoItem, VideoProvider, VideoSettings as VideoSettingsType } from "@/types";
import { createBatchJob, getBatchJobs, updateBatchItem, deleteBatchJob } from "@/lib/batchProcessor";
import { validateText } from "@/lib/validation";
import { useToast } from "./ToastContainer";
import VideoProviderSelector from "./VideoProviderSelector";
import VideoSettings from "./VideoSettings";
import { logger } from "@/lib/logger";

interface BatchProcessorProps {
  onClose?: () => void;
}

export default function BatchProcessor({ onClose }: BatchProcessorProps) {
  const [texts, setTexts] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<VideoProvider>("replicate");
  const [videoSettings, setVideoSettings] = useState<VideoSettingsType>({
    duration: 8,
    resolution: "1080p",
    style: "professional",
  });
  const [processing, setProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<BatchVideoJob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError, info } = useToast();

  const handleAddText = () => {
    if (!currentText.trim()) {
      showError("Lütfen bir metin girin");
      return;
    }

    const validation = validateText(currentText);
    if (!validation.valid) {
      showError(validation.error || "Geçersiz metin");
      return;
    }

    setTexts([...texts, currentText.trim()]);
    setCurrentText("");
    success("Metin eklendi");
  };

  const handleRemoveText = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        // Try to parse as JSON
        if (file.name.endsWith(".json")) {
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            const extractedTexts = data.map((item) => 
              typeof item === "string" ? item : item.text || item.content || ""
            ).filter((text) => text.trim().length > 0);
            setTexts([...texts, ...extractedTexts]);
            success(`${extractedTexts.length} metin yüklendi`);
          } else {
            throw new Error("JSON formatı geçersiz. Array bekleniyor.");
          }
        } else if (file.name.endsWith(".csv")) {
          // Parse CSV
          const lines = content.split("\n");
          const extractedTexts = lines
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith("#"));
          setTexts([...texts, ...extractedTexts]);
          success(`${extractedTexts.length} metin yüklendi`);
        } else if (file.name.endsWith(".txt")) {
          // Parse TXT (one text per line)
          const lines = content.split("\n");
          const extractedTexts = lines
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          setTexts([...texts, ...extractedTexts]);
          success(`${extractedTexts.length} metin yüklendi`);
        } else {
          showError("Desteklenmeyen dosya formatı. JSON, CSV veya TXT kullanın.");
        }
      } catch (err: any) {
        showError(err.message || "Dosya okunamadı");
      }
    };

    if (file.name.endsWith(".json") || file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
      reader.readAsText(file);
    } else {
      showError("Desteklenmeyen dosya formatı");
    }
  };

  const handleStartBatch = async () => {
    if (texts.length === 0) {
      showError("En az bir metin ekleyin");
      return;
    }

    setProcessing(true);
    const job = createBatchJob(texts);
    setCurrentJob(job);
    info(`Toplu işlem başlatıldı: ${texts.length} video oluşturulacak`);

    // Process each text sequentially
    for (let i = 0; i < job.items.length; i++) {
      const item = job.items[i];
      
      try {
        // Update item status
        updateBatchItem(job.id, item.id, {
          status: "generating-audio",
          progress: 0,
        });

        // Step 1: Generate audio
        const audioResponse = await fetch("/api/generate-audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: item.text,
            voiceId: undefined, // Use default voice for batch
          }),
        });

        const audioData = await audioResponse.json();
        if (!audioData.success) {
          throw new Error(audioData.error || "Ses oluşturulamadı");
        }

        updateBatchItem(job.id, item.id, {
          status: "generating-video",
          progress: 30,
          audioUrl: audioData.audioUrl,
        });

        // Step 2: Generate video
        const videoPrompt = `A professional influencer speaking: ${item.text}`;
        const videoResponse = await fetch("/api/generate-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audioUrl: audioData.audioUrl,
            prompt: videoPrompt,
            usePolling: true,
            settings: videoSettings,
            provider: selectedProvider,
          }),
        });

        const videoData = await videoResponse.json();
        if (!videoData.success) {
          throw new Error(videoData.error || "Video oluşturulamadı");
        }

        // Start polling for this video
        if (videoData.predictionId) {
          await pollVideoStatus(job.id, item.id, videoData.predictionId, selectedProvider);
        } else if (videoData.videoUrl) {
          updateBatchItem(job.id, item.id, {
            status: "completed",
            progress: 100,
            videoUrl: videoData.videoUrl,
            completedAt: Date.now(),
          });
        }
      } catch (err: any) {
        updateBatchItem(job.id, item.id, {
          status: "error",
          error: err.message || "Bir hata oluştu",
        });
        logger.error(`Batch item ${item.id} failed:`, err);
      }

      // Small delay between items to avoid rate limiting
      if (i < job.items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setProcessing(false);
    success("Toplu işlem tamamlandı!");
  };

  const pollVideoStatus = async (
    jobId: string,
    itemId: string,
    predictionId: string,
    provider: VideoProvider
  ): Promise<void> => {
    const maxAttempts = 200; // 10 minutes max (200 * 3 seconds)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/video-status?predictionId=${predictionId}&provider=${provider}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Video durumu kontrol edilemedi");
        }

        updateBatchItem(jobId, itemId, {
          progress: data.progress || 50,
        });

        if (data.status === "succeeded" && data.output) {
          updateBatchItem(jobId, itemId, {
            status: "completed",
            progress: 100,
            videoUrl: data.output,
            completedAt: Date.now(),
          });
          return;
        } else if (data.status === "failed" || data.status === "canceled") {
          throw new Error(data.error || "Video oluşturulamadı");
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (err: any) {
        updateBatchItem(jobId, itemId, {
          status: "error",
          error: err.message || "Video durumu kontrol edilemedi",
        });
        throw err;
      }
    }

    throw new Error("Video oluşturma zaman aşımına uğradı");
  };

  const handleDownloadAll = () => {
    if (!currentJob) return;

    const completedItems = currentJob.items.filter((item) => item.status === "completed" && item.videoUrl);
    
    completedItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = item.videoUrl!;
        link.download = `batch-video-${currentJob.id}-${index + 1}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500); // Stagger downloads
    });

    success(`${completedItems.length} video indiriliyor...`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Toplu Video Oluşturma
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

      {/* Settings */}
      <div className="space-y-4 mb-6">
        <VideoProviderSelector
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          disabled={processing}
        />
        <VideoSettings
          settings={videoSettings}
          onSettingsChange={setVideoSettings}
          disabled={processing}
        />
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Metin Ekle
        </label>
        <div className="flex gap-2">
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            disabled={processing}
            rows={3}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
            placeholder="Video için metin girin..."
          />
          <button
            onClick={handleAddText}
            disabled={processing || !currentText.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dosyadan Yükle (JSON, CSV, TXT)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.txt"
          onChange={handleFileUpload}
          disabled={processing}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          JSON: Array of strings veya objects with &quot;text&quot; field<br />
          CSV: Her satır bir metin<br />
          TXT: Her satır bir metin
        </p>
      </div>

      {/* Text List */}
      {texts.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Metinler ({texts.length})
            </label>
            <button
              onClick={() => setTexts([])}
              disabled={processing}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Tümünü Temizle
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            {texts.map((text, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {index + 1}. {text.substring(0, 100)}{text.length > 100 ? "..." : ""}
                </span>
                <button
                  onClick={() => handleRemoveText(index)}
                  disabled={processing}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStartBatch}
        disabled={processing || texts.length === 0}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {processing ? `İşleniyor... (${currentJob?.completedCount || 0}/${currentJob?.totalCount || 0})` : `${texts.length} Video Oluştur`}
      </button>

      {/* Current Job Progress */}
      {currentJob && (
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                İlerleme
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentJob.completedCount} / {currentJob.totalCount} tamamlandı
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(currentJob.completedCount / currentJob.totalCount) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {currentJob.items.map((item) => (
              <BatchItemProgress key={item.id} item={item} jobId={currentJob.id} />
            ))}
          </div>

          {currentJob.status === "completed" && (
            <button
              onClick={handleDownloadAll}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📥 Tüm Videoları İndir ({currentJob.completedCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BatchItemProgress({ item, jobId }: { item: BatchVideoItem; jobId: string }) {
  const statusColors = {
    pending: "bg-gray-200 dark:bg-gray-700",
    "generating-audio": "bg-blue-500",
    "generating-video": "bg-purple-500",
    completed: "bg-green-500",
    error: "bg-red-500",
  };

  const statusIcons = {
    pending: "⏳",
    "generating-audio": "🎵",
    "generating-video": "🎬",
    completed: "✓",
    error: "✕",
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{statusIcons[item.status]}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {item.text.substring(0, 50)}{item.text.length > 50 ? "..." : ""}
          </span>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {item.progress || 0}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className={`${statusColors[item.status]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${item.progress || 0}%` }}
        />
      </div>
      {item.error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{item.error}</p>
      )}
      {item.videoUrl && (
        <a
          href={item.videoUrl}
          download
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
        >
          📥 İndir
        </a>
      )}
    </div>
  );
}

