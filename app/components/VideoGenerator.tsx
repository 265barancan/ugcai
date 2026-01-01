"use client";

import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import TextInput from "./TextInput";
import VideoPreview from "./VideoPreview";
import LoadingState from "./LoadingState";
import VoiceSelector from "./VoiceSelector";
import VideoSettings from "./VideoSettings";
import VideoHistory from "./VideoHistory";
import { ToastContainer, useToast } from "./ToastContainer";
import { GenerationStatus, VideoStatusResponse, VideoSettings as VideoSettingsType, VideoHistoryItem, VideoProvider, TTSProvider } from "@/types";
import { saveVideoToHistory } from "@/lib/videoHistory";
import { validateText, validateVideoSettings, sanitizeText } from "@/lib/validation";
import { logger } from "@/lib/logger";
import VideoProviderSelector from "./VideoProviderSelector";
import VideoModelSelector from "./VideoModelSelector";
import VideoTemplateSelector from "./VideoTemplateSelector";
import TTSProviderSelector from "./TTSProviderSelector";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AvatarGenerator from "./AvatarGenerator";
import ImageGenerator from "./ImageGenerator";
import CharacterOutfitGenerator from "./CharacterOutfitGenerator";
import VideoMerger from "./VideoMerger";
import VideoCollections from "./VideoCollections";
import AvatarJewelryEditor from "./AvatarJewelryEditor";

// Lazy load heavy components
const BatchProcessor = lazy(() => import("./BatchProcessor"));

interface VideoGeneratorProps {
  initialAction?: "new-video" | "batch" | "history" | "analytics" | "avatar" | "image" | "outfit" | "merge" | "collections" | "jewelry";
  onClose?: () => void;
}

export default function VideoGenerator({ initialAction, onClose }: VideoGeneratorProps = {}) {
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>({
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [videoSettings, setVideoSettings] = useState<VideoSettingsType>({
    duration: 8,
    resolution: "1080p",
    style: "professional",
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAvatarGenerator, setShowAvatarGenerator] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showOutfitGenerator, setShowOutfitGenerator] = useState(false);
  const [showVideoMerger, setShowVideoMerger] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showJewelryEditor, setShowJewelryEditor] = useState(false);

  // Handle initial action from dashboard
  useEffect(() => {
    console.log("VideoGenerator initialAction changed:", initialAction);
    if (!initialAction) {
      // Reset all panels when action is cleared
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      return;
    }
    
    // Extract action type (remove timestamp if present)
    const actionType = initialAction.split('-')[0] as "new-video" | "batch" | "history" | "analytics" | "avatar" | "image" | "outfit" | "merge" | "collections";
    
    if (actionType === "batch") {
      setShowBatchProcessor(true);
      setShowHistory(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="batch"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "history") {
      setShowHistory(true);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="history"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "analytics") {
      setShowAnalytics(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="analytics"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "avatar") {
      setShowAvatarGenerator(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowImageGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="avatar"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "image") {
      setShowImageGenerator(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowOutfitGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="image"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "outfit") {
      setShowOutfitGenerator(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowImageGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="outfit"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "merge") {
      setShowVideoMerger(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="merge"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "collections") {
      setShowCollections(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowJewelryEditor(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="collections"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "jewelry") {
      setShowJewelryEditor(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      // Scroll to panel after it's rendered
      setTimeout(() => {
        const panel = document.querySelector('[data-panel="jewelry"]');
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else if (actionType === "new-video") {
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
      setShowJewelryEditor(false);
      // Scroll to video generator form
      setTimeout(() => {
        const element = document.querySelector('[data-video-generator]');
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [initialAction]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<VideoProvider>("replicate");
  const [selectedVideoModel, setSelectedVideoModel] = useState<string>("");
  const [selectedTTSProvider, setSelectedTTSProvider] = useState<TTSProvider | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toasts, removeToast, success, error: showError, info } = useToast();

  // Reset model selection when provider changes
  useEffect(() => {
    setSelectedVideoModel("");
  }, [selectedProvider]);

  // Handle initial action from dashboard
  useEffect(() => {
    if (initialAction === "batch") {
      setShowBatchProcessor(true);
      setShowHistory(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    } else if (initialAction === "history") {
      setShowHistory(true);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    } else if (initialAction === "analytics") {
      setShowAnalytics(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    } else if (initialAction === "avatar") {
      setShowAvatarGenerator(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowImageGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    } else if (initialAction === "image") {
      setShowImageGenerator(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowOutfitGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    } else if (initialAction === "outfit") {
      setShowOutfitGenerator(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowImageGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    } else if (initialAction === "merge") {
      setShowVideoMerger(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowCollections(false);
    } else if (initialAction === "collections") {
      setShowCollections(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowJewelryEditor(false);
    } else if (initialAction === "jewelry") {
      setShowJewelryEditor(true);
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    } else if (initialAction === "new-video") {
      setShowHistory(false);
      setShowBatchProcessor(false);
      setShowAnalytics(false);
      setShowAvatarGenerator(false);
      setShowVideoMerger(false);
      setShowCollections(false);
    }
  }, [initialAction]);

  // Helper function to get status message
  const getStatusMessage = (status: string): string => {
    switch (status) {
      case "starting":
        return "Video oluşturma başlatılıyor...";
      case "processing":
        return "Video oluşturuluyor... Bu işlem birkaç dakika sürebilir.";
      case "succeeded":
        return "Video hazır!";
      case "failed":
        return "Video oluşturulamadı";
      case "canceled":
        return "Video oluşturma iptal edildi";
      default:
        return "Video oluşturuluyor...";
    }
  };

  // Polling function to check video generation status
  const pollVideoStatus = useCallback(async (predId: string, provider: VideoProvider) => {
    try {
      const response = await fetch(`/api/video-status?predictionId=${predId}&provider=${provider}`);
      const data: VideoStatusResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Video durumu kontrol edilemedi");
      }

      // Update progress
      setStatus({
        status: "generating-video",
        message: getStatusMessage(data.status),
        progress: data.progress,
      });

      // Check if video is ready
      if (data.status === "succeeded" && data.output) {
        const finalVideoUrl = data.output;
        setVideoUrl(finalVideoUrl);
        setStatus({ status: "completed", message: "Video hazır!", progress: 100 });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setPredictionId(null);
        
        // Generate thumbnail for the video
        let thumbnailUrl: string | undefined;
        try {
          const thumbnailResponse = await fetch("/api/generate-thumbnail", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              videoUrl: finalVideoUrl,
              time: 1, // Capture at 1 second
              width: 320,
            }),
          });
          
          if (thumbnailResponse.ok) {
            const thumbnailData = await thumbnailResponse.json();
            if (thumbnailData.success) {
              thumbnailUrl = thumbnailData.thumbnailUrl;
            }
          }
        } catch (error) {
          // Thumbnail generation is optional, don't fail if it errors
          logger.warn("Thumbnail generation failed:", error);
        }
        
        // Save to history
        saveVideoToHistory({
          videoUrl: finalVideoUrl,
          audioUrl: audioUrl || undefined,
          text: text,
          voiceId: selectedVoiceId || undefined,
          voiceName: selectedVoiceName || undefined,
          settings: videoSettings,
          thumbnail: thumbnailUrl,
        });
        
        success("Video başarıyla oluşturuldu!");
      } else if (data.status === "failed" || data.status === "canceled") {
        throw new Error(data.error || "Video oluşturulamadı");
      }
    } catch (err: any) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      const errorMessage = err.message || "Video durumu kontrol edilirken bir hata oluştu";
      setError(errorMessage);
      setStatus({ status: "error", message: errorMessage });
      setPredictionId(null);
      showError(errorMessage);
    }
  }, [audioUrl, text, selectedVoiceId, selectedVoiceName, videoSettings, success, showError]);

  // Start polling when predictionId is set
  useEffect(() => {
    if (predictionId && !pollingIntervalRef.current) {
      // Poll immediately first time
      pollVideoStatus(predictionId, selectedProvider);
      
      // Then poll every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollVideoStatus(predictionId, selectedProvider);
      }, 3000);
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [predictionId, selectedProvider, pollVideoStatus]);

  const handleReset = useCallback(() => {
    setText("");
    setVideoUrl(null);
    setAudioUrl(null);
    setStatus({ status: "idle" });
    setError(null);
    setPredictionId(null);
    
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    // Keep voice selection on reset
  }, []);

  const handleGenerate = useCallback(async () => {
    // Validate text input
    const textValidation = validateText(text);
    if (!textValidation.valid) {
      setError(textValidation.error || "Geçersiz metin girişi");
      return;
    }

    // Validate video settings
    const settingsValidation = validateVideoSettings(videoSettings);
    if (!settingsValidation.valid) {
      setError(settingsValidation.error || "Geçersiz video ayarları");
      return;
    }

    // Sanitize text
    const sanitizedText = sanitizeText(text);
    if (sanitizedText !== text) {
      setText(sanitizedText);
    }

    setError(null);
    setVideoUrl(null);
    setAudioUrl(null);
    setPredictionId(null);
    setStatus({ status: "generating-audio", message: "Ses oluşturuluyor...", progress: 0 });

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    try {
      // Step 1: Generate audio
      const audioResponse = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text,
          voiceId: selectedVoiceId || undefined,
          provider: selectedTTSProvider || "edgetts", // Fallback to Edge TTS if not selected
        }),
      });

      const audioData = await audioResponse.json();

      if (!audioData.success) {
        throw new Error(audioData.error || "Ses oluşturulamadı");
      }

      setAudioUrl(audioData.audioUrl);
      setStatus({
        status: "generating-video",
        message: "Video oluşturma başlatılıyor...",
        progress: 10,
      });
      info("Ses oluşturuldu, video oluşturma başlatılıyor...");

      // Step 2: Create video prediction (with polling enabled)
      // Build prompt based on style
      const stylePrompts: Record<string, string> = {
        professional: "A professional influencer speaking",
        friendly: "A friendly and approachable person speaking",
        energetic: "An energetic and enthusiastic person speaking",
        calm: "A calm and soothing person speaking",
        dramatic: "A dramatic and expressive person speaking",
      };
      const stylePrompt = stylePrompts[videoSettings.style] || stylePrompts.professional;
      const videoPrompt = `${stylePrompt}: ${text}`;
      
      const videoResponse = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl: audioData.audioUrl,
          prompt: videoPrompt,
          usePolling: true, // Enable polling mode
          settings: videoSettings, // Include video settings
          provider: selectedProvider, // Include selected provider
          model: selectedVideoModel || undefined, // Include selected model
        }),
      });

      const videoData = await videoResponse.json();

      if (!videoData.success) {
        // Check if it's a rate limit error
        if (videoResponse.status === 429) {
          throw new Error(
            videoData.error || 
            "Replicate API rate limit aşıldı. Lütfen birkaç saniye bekleyip tekrar deneyin.\n\n" +
            "💡 İpucu: Ödeme yöntemi eklenmemiş hesaplar için limit: 6 istek/dakika.\n" +
            "Daha yüksek limit için Replicate hesabınıza ödeme yöntemi ekleyin."
          );
        }
        throw new Error(videoData.error || "Video oluşturulamadı");
      }

      // Start polling if prediction ID is returned
      if (videoData.predictionId) {
        setPredictionId(videoData.predictionId);
        setStatus({
          status: "generating-video",
          message: "Video oluşturma başlatıldı...",
          progress: 20,
        });
      } else if (videoData.videoUrl) {
        // Fallback: if video URL is directly returned (legacy mode)
        const finalVideoUrl = videoData.videoUrl;
        setVideoUrl(finalVideoUrl);
        setStatus({ status: "completed", message: "Video hazır!", progress: 100 });
        
        // Save to history
        saveVideoToHistory({
          videoUrl: finalVideoUrl,
          audioUrl: audioData.audioUrl,
          text: text,
          voiceId: selectedVoiceId || undefined,
          voiceName: selectedVoiceName || undefined,
          settings: videoSettings,
        });
      } else {
        throw new Error("Video oluşturulamadı: Geçersiz yanıt");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Bir hata oluştu";
      setError(errorMessage);
      setStatus({ status: "error", message: errorMessage });
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setPredictionId(null);
      showError(errorMessage);
    }
  }, [text, videoSettings, selectedVoiceId, selectedTTSProvider, selectedProvider, selectedVoiceName, showError, info, success]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter: Generate video
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const textValidation = validateText(text);
        if (textValidation.valid && status.status !== "generating-audio" && status.status !== "generating-video") {
          handleGenerate();
        }
      }

      // Ctrl+R or Cmd+R: Reset (only if not generating)
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        if (status.status !== "generating-audio" && status.status !== "generating-video") {
          e.preventDefault();
          handleReset();
        }
      }

      // Escape: Close history or clear error
      if (e.key === "Escape") {
        if (showHistory) {
          setShowHistory(false);
        }
        if (error) {
          setError(null);
        }
      }

      // Ctrl+H or Cmd+H: Toggle history
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        setShowHistory(!showHistory);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, status, showHistory, error, handleGenerate, handleReset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8" data-video-generator>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="max-w-4xl mx-auto">
        {/* Back to Dashboard Button */}
        {onClose && (
          <div className="mb-6">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ana Sayfaya Dön
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="space-y-6">
            <VideoTemplateSelector
              onTemplateSelect={(template) => {
                // Apply template settings
                setVideoSettings(template.settings);
                // Optionally set example text
                if (template.exampleText && !text) {
                  setText(template.exampleText);
                }
              }}
              disabled={status.status === "generating-audio" || status.status === "generating-video"}
            />
            
            <TTSProviderSelector
              selectedProvider={selectedTTSProvider || "edgetts"}
              onProviderChange={(provider) => {
                setSelectedTTSProvider(provider);
                // Reset voice selection when provider changes
                setSelectedVoiceId(null);
              }}
              disabled={status.status === "generating-audio" || status.status === "generating-video"}
            />

            {selectedTTSProvider && (
              <VoiceSelector
                selectedVoiceId={selectedVoiceId}
                onVoiceChange={(voiceId) => {
                  setSelectedVoiceId(voiceId);
                  // Voice name will be set when we have access to voice list
                  // For now, we'll get it from the voice selector component
                }}
                disabled={status.status === "generating-audio" || status.status === "generating-video"}
                provider={selectedTTSProvider}
              />
            )}
            
            <VideoProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={(provider) => {
                setSelectedProvider(provider);
                // Reset model selection when provider changes
                setSelectedVideoModel("");
              }}
              disabled={status.status === "generating-audio" || status.status === "generating-video"}
            />
            
            <VideoModelSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedVideoModel}
              onModelChange={setSelectedVideoModel}
              disabled={status.status === "generating-audio" || status.status === "generating-video"}
            />
            
            <VideoSettings
              settings={videoSettings}
              onSettingsChange={setVideoSettings}
              disabled={status.status === "generating-audio" || status.status === "generating-video"}
            />
            
            <TextInput
              value={text}
              onChange={setText}
              onGenerate={handleGenerate}
              disabled={status.status === "generating-audio" || status.status === "generating-video"}
            />
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {(status.status === "generating-audio" ||
            status.status === "generating-video") && (
            <LoadingState status={status} />
          )}
        </div>

        {showAnalytics && (
          <div className="mb-6" data-panel="analytics">
            <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
          </div>
        )}

        {showBatchProcessor && (
          <div className="mb-6" data-panel="batch">
            <Suspense fallback={
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500 dark:text-gray-400">Yükleniyor...</div>
                </div>
              </div>
            }>
              <BatchProcessor onClose={() => setShowBatchProcessor(false)} />
            </Suspense>
          </div>
        )}

        {showHistory && (
          <div className="mb-6" data-panel="history">
            <VideoHistory
              onSelectVideo={(video: VideoHistoryItem) => {
                setVideoUrl(video.videoUrl);
                setAudioUrl(video.audioUrl || null);
                setText(video.text);
                if (video.voiceId) setSelectedVoiceId(video.voiceId);
                if (video.settings) setVideoSettings(video.settings);
                setShowHistory(false);
              }}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}

        {showAvatarGenerator && (
          <div className="mb-6" data-panel="avatar">
            <AvatarGenerator />
          </div>
        )}

        {showImageGenerator && (
          <div className="mb-6" data-panel="image">
            <ImageGenerator />
          </div>
        )}

        {showOutfitGenerator && (
          <div className="mb-6" data-panel="outfit">
            <CharacterOutfitGenerator />
          </div>
        )}

        {showVideoMerger && (
          <div className="mb-6" data-panel="merge">
            <VideoMerger onClose={() => setShowVideoMerger(false)} />
          </div>
        )}

        {showCollections && (
          <div className="mb-6" data-panel="collections">
            <VideoCollections onClose={() => setShowCollections(false)} />
          </div>
        )}

        {showJewelryEditor && (
          <div className="mb-6" data-panel="jewelry">
            <AvatarJewelryEditor />
          </div>
        )}

        {audioUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Oluşturulan Ses
            </h2>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Tarayıcınız ses oynatmayı desteklemiyor.
            </audio>
          </div>
        )}

        {videoUrl && (
          <VideoPreview videoUrl={videoUrl} onReset={handleReset} videoText={text} />
        )}
      </div>
    </div>
  );
}

