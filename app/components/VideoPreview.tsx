"use client";

import { useState, useEffect } from "react";
import VideoEditor from "./VideoEditor";
import ShareButtons from "./ShareButtons";
import VideoSummary from "./VideoSummary";
import VideoExporter from "./VideoExporter";
import WatermarkEditor from "./WatermarkEditor";
import SubtitleEditor from "./SubtitleEditor";
import BackgroundMusicEditor from "./BackgroundMusicEditor";
import VideoEffectsEditor from "./VideoEffectsEditor";
import VideoFormatConverter from "./VideoFormatConverter";
import VideoCompressor from "./VideoCompressor";
import VideoTranscriber from "./VideoTranscriber";
import VideoTimelineEditor from "./VideoTimelineEditor";
import ColorCorrectionEditor from "./ColorCorrectionEditor";
import { fetchVideoWithCache } from "@/lib/videoCache";
import { applyWatermarkToVideo } from "@/lib/watermark";
import { WatermarkOptions } from "@/types";

interface VideoPreviewProps {
  videoUrl: string;
  onReset: () => void;
  videoText?: string;
}

export default function VideoPreview({ videoUrl, onReset, videoText }: VideoPreviewProps) {
  const [showShare, setShowShare] = useState(false);
  const [showExporter, setShowExporter] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showBackgroundMusic, setShowBackgroundMusic] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showFormatConverter, setShowFormatConverter] = useState(false);
  const [showCompressor, setShowCompressor] = useState(false);
  const [showTranscriber, setShowTranscriber] = useState(false);
  const [showTimelineEditor, setShowTimelineEditor] = useState(false);
  const [showColorCorrection, setShowColorCorrection] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    // Load video with caching
    const loadVideo = async () => {
      try {
        setLoading(true);
        const url = await fetchVideoWithCache(videoUrl);
        setCachedVideoUrl(url);
      } catch (error) {
        // Fallback to original URL if caching fails
        setCachedVideoUrl(videoUrl);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();

    // Cleanup object URL on unmount
    return () => {
      if (cachedVideoUrl && cachedVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(cachedVideoUrl);
      }
    };
  }, [videoUrl]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `ugc-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateThumbnail = async () => {
    setGeneratingThumbnail(true);
    try {
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: watermarkedUrl || cachedVideoUrl || videoUrl,
          time: 1,
          width: 640,
        }),
      });

      const data = await response.json();

      if (data.success && data.thumbnailUrl) {
        setThumbnailUrl(data.thumbnailUrl);
      } else {
        alert("Thumbnail oluşturulamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (error: any) {
      console.error("Error generating thumbnail:", error);
      alert("Thumbnail oluşturulurken bir hata oluştu: " + error.message);
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  const handleDownloadThumbnail = () => {
    if (!thumbnailUrl) return;

    const link = document.createElement("a");
    link.href = thumbnailUrl;
    link.download = `video-thumbnail-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEdit = (editedVideo: { trimmedUrl?: string; thumbnail?: string }) => {
    // In a real app, you'd update the video URL and thumbnail
    if (editedVideo.thumbnail) {
      // Thumbnail saved - could be saved to localStorage or sent to server
      // You could save the thumbnail to localStorage or send it to a server
    }
    setShowEditor(false);
  };

  if (showEditor) {
    return (
      <VideoEditor
        videoUrl={videoUrl}
        videoText={videoText}
        onSave={handleSaveEdit}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Oluşturulan Video
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowEditor(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            ✏️ Düzenle
          </button>
          <button
            onClick={() => setShowWatermark(!showWatermark)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            {showWatermark ? "✕ Watermark'ı Gizle" : "💧 Watermark"}
          </button>
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
          >
            {showSubtitles ? "✕ Altyazıyı Gizle" : "📝 Altyazı"}
          </button>
          <button
            onClick={() => setShowBackgroundMusic(!showBackgroundMusic)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors"
          >
            {showBackgroundMusic ? "✕ Müziği Gizle" : "🎵 Müzik"}
          </button>
          <button
            onClick={() => setShowEffects(!showEffects)}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
          >
            {showEffects ? "✕ Efektleri Gizle" : "✨ Efektler"}
          </button>
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
          >
            {showEditor ? "✕ Düzenleyiciyi Gizle" : "✂️ Düzenle"}
          </button>
          <button
            onClick={() => setShowFormatConverter(!showFormatConverter)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            {showFormatConverter ? "✕ Dönüştürücüyü Gizle" : "🔄 Format"}
          </button>
          <button
            onClick={() => setShowCompressor(!showCompressor)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          >
            {showCompressor ? "✕ Sıkıştırıcıyı Gizle" : "🗜️ Sıkıştır"}
          </button>
          <button
            onClick={() => setShowTranscriber(!showTranscriber)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
          >
            {showTranscriber ? "✕ Transkripti Gizle" : "📝 Transkript"}
          </button>
          <button
            onClick={() => setShowTimelineEditor(!showTimelineEditor)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors"
          >
            {showTimelineEditor ? "✕ Timeline'ı Gizle" : "⏱️ Timeline"}
          </button>
          <button
            onClick={() => setShowColorCorrection(!showColorCorrection)}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-colors"
          >
            {showColorCorrection ? "✕ Renk Düzeltmeyi Gizle" : "🎨 Renk Düzeltme"}
          </button>
          <button
            onClick={() => setShowExporter(!showExporter)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            {showExporter ? "✕ Export'u Gizle" : "💾 Export"}
          </button>
          <button
            onClick={() => setShowShare(!showShare)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            {showShare ? "✕ Paylaşımı Gizle" : "🔗 Paylaş"}
          </button>
          <button
            onClick={handleGenerateThumbnail}
            disabled={generatingThumbnail}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Video'dan thumbnail oluştur"
          >
            {generatingThumbnail ? "⏳ Oluşturuluyor..." : "🖼️ Thumbnail"}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            📥 İndir
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Yeni Video
          </button>
        </div>
      </div>

      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white">Video yükleniyor...</div>
          </div>
        ) : (
          <video
            src={watermarkedUrl || cachedVideoUrl || videoUrl}
            controls
            className="w-full h-full"
            autoPlay
            onLoadedMetadata={(e) => {
              setVideoDuration(e.currentTarget.duration);
            }}
          >
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        )}
      </div>

      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-green-800 dark:text-green-200 text-sm">
          ✓ Video başarıyla oluşturuldu! İndir butonuna tıklayarak videoyu kaydedebilirsiniz.
        </p>
      </div>

      {thumbnailUrl && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Oluşturulan Thumbnail
              </h3>
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full max-w-xs rounded-lg shadow-md"
              />
            </div>
            <button
              onClick={handleDownloadThumbnail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              📥 Thumbnail İndir
            </button>
          </div>
        </div>
      )}

      {showExporter && (
        <div className="mt-6">
          <VideoExporter
            videoUrl={videoUrl}
            videoTitle={videoText?.substring(0, 30) || "ugc-video"}
            onClose={() => setShowExporter(false)}
          />
        </div>
      )}

      {showShare && (
        <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <ShareButtons
            videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
            title="AI UGC Video"
            description={videoText || "AI ile oluşturulmuş influencer videosu"}
            thumbnailUrl={thumbnailUrl || undefined}
          />
        </div>
      )}

        {showWatermark && (
          <div className="mt-6">
            <WatermarkEditor
              videoUrl={cachedVideoUrl || videoUrl}
              onSave={async (options) => {
                setWatermarkOptions(options);
                if (options.enabled) {
                  try {
                    const watermarked = await applyWatermarkToVideo(cachedVideoUrl || videoUrl, options);
                    setWatermarkedUrl(watermarked);
                  } catch (error: any) {
                    console.error("Watermark uygulanamadı:", error);
                  }
                } else {
                  setWatermarkedUrl(null);
                }
                setShowWatermark(false);
              }}
              onCancel={() => setShowWatermark(false)}
            />
          </div>
        )}

        {showSubtitles && (
          <div className="mt-6">
            <SubtitleEditor
              videoText={videoText || ""}
              videoDuration={videoDuration}
              onSave={(subtitles) => {
                // Subtitles saved - could be used for video processing later
                console.log("Subtitles saved:", subtitles);
                setShowSubtitles(false);
              }}
              onCancel={() => setShowSubtitles(false)}
            />
          </div>
        )}

        {showBackgroundMusic && (
          <div className="mt-6">
            <BackgroundMusicEditor
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(options, musicFile) => {
                // Background music options saved
                // TODO: Implement actual audio mixing with FFmpeg
                console.log("Background music options:", options, musicFile);
                alert("Müzik ekleme özelliği yakında eklenecek. FFmpeg entegrasyonu gerekiyor.");
                setShowBackgroundMusic(false);
              }}
              onCancel={() => setShowBackgroundMusic(false)}
            />
          </div>
        )}

        {showEffects && (
          <div className="mt-6">
            <VideoEffectsEditor
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(filteredUrl, effects) => {
                // Effects applied - update video URL
                setWatermarkedUrl(filteredUrl);
                console.log("Effects applied:", effects);
                setShowEffects(false);
              }}
              onCancel={() => setShowEffects(false)}
            />
          </div>
        )}

        {showEditor && (
          <div className="mt-6">
            <VideoEditor
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(editedUrl, edits) => {
                // Edits applied - update video URL
                setWatermarkedUrl(editedUrl);
                console.log("Edits applied:", edits);
                setShowEditor(false);
              }}
              onCancel={() => setShowEditor(false)}
            />
          </div>
        )}

        {showFormatConverter && (
          <div className="mt-6">
            <VideoFormatConverter
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(convertedUrl, format) => {
                // Format converted - update video URL
                setWatermarkedUrl(convertedUrl);
                console.log("Format converted:", format);
                setShowFormatConverter(false);
              }}
              onCancel={() => setShowFormatConverter(false)}
            />
          </div>
        )}

        {showCompressor && (
          <div className="mt-6">
            <VideoCompressor
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(compressedUrl, compression) => {
                // Video compressed - update video URL
                setWatermarkedUrl(compressedUrl);
                console.log("Video compressed:", compression);
                setShowCompressor(false);
              }}
              onCancel={() => setShowCompressor(false)}
            />
          </div>
        )}

        {showTranscriber && (
          <div className="mt-6">
            <VideoTranscriber
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(transcript) => {
                console.log("Transcript saved:", transcript);
                setShowTranscriber(false);
              }}
              onCancel={() => setShowTranscriber(false)}
            />
          </div>
        )}

        {showTimelineEditor && (
          <div className="mt-6">
            <VideoTimelineEditor
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(chapters) => {
                console.log("Chapters saved:", chapters);
                // Save chapters to video history or local storage
                setShowTimelineEditor(false);
              }}
              onCancel={() => setShowTimelineEditor(false)}
            />
          </div>
        )}

        {showColorCorrection && (
          <div className="mt-6">
            <ColorCorrectionEditor
              videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl}
              onSave={(correctedUrl, options) => {
                // Color correction applied - update video URL
                setWatermarkedUrl(correctedUrl);
                console.log("Color correction applied:", options);
                setShowColorCorrection(false);
              }}
              onCancel={() => setShowColorCorrection(false)}
            />
          </div>
        )}

        {videoText && (
          <VideoSummary videoText={videoText} videoUrl={watermarkedUrl || cachedVideoUrl || videoUrl} />
        )}
    </div>
  );
}

