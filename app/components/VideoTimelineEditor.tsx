"use client";

import { useState, useRef, useEffect } from "react";
import VideoTimeline, { VideoChapter } from "./VideoTimeline";

interface VideoTimelineEditorProps {
  videoUrl: string;
  onSave?: (chapters: VideoChapter[]) => void;
  onCancel?: () => void;
}

export default function VideoTimelineEditor({
  videoUrl,
  onSave,
  onCancel,
}: VideoTimelineEditorProps) {
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleChapterAdd = (time: number, title: string) => {
    const newChapter: VideoChapter = {
      id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time,
      title,
    };
    setChapters([...chapters, newChapter]);
  };

  const handleChapterDelete = (id: string) => {
    setChapters(chapters.filter((c) => c.id !== id));
  };

  const handleChapterUpdate = (id: string, time: number, title: string) => {
    setChapters(
      chapters.map((c) => (c.id === id ? { ...c, time, title } : c))
    );
  };

  const handleSave = () => {
    if (onSave) {
      onSave(chapters);
    }
  };

  const handleFrameStep = (direction: "forward" | "backward") => {
    if (videoRef.current) {
      const step = 1 / 30; // 30 FPS için 1 frame
      const newTime =
        direction === "forward"
          ? videoRef.current.currentTime + step
          : videoRef.current.currentTime - step;
      handleSeek(Math.max(0, Math.min(videoDuration, newTime)));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            handleFrameStep("backward");
          } else {
            handleSeek(Math.max(0, currentTime - 5));
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            handleFrameStep("forward");
          } else {
            handleSeek(Math.min(videoDuration, currentTime + 5));
          }
          break;
        case "c":
        case "C":
          if (e.ctrlKey || e.metaKey) return; // Don't interfere with copy
          e.preventDefault();
          // Open chapter form at current time
          const title = prompt("Bölüm başlığı:");
          if (title) {
            handleChapterAdd(currentTime, title);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentTime, videoDuration, handlePlayPause, handleSeek, handleFrameStep, handleChapterAdd]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Video Timeline Düzenleyici
        </h2>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
          )}
          {onSave && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Kaydet
            </button>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div className="mb-6">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full rounded-lg"
          controls={false}
        >
          Tarayıcınız video oynatmayı desteklemiyor.
        </video>

        {/* Custom Controls */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => handleFrameStep("backward")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            title="1 Frame Geri"
          >
            ⏪
          </button>
          <button
            onClick={handlePlayPause}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xl"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => handleFrameStep("forward")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            title="1 Frame İleri"
          >
            ⏩
          </button>
        </div>
      </div>

      {/* Timeline */}
      <VideoTimeline
        videoUrl={videoUrl}
        videoDuration={videoDuration}
        currentTime={currentTime}
        onSeek={handleSeek}
        chapters={chapters}
        onChapterAdd={handleChapterAdd}
        onChapterDelete={handleChapterDelete}
        onChapterUpdate={handleChapterUpdate}
      />

      {/* Keyboard Shortcuts Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
          ⌨️ Klavye Kısayolları
        </h4>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>Space:</strong> Oynat/Duraklat</p>
          <p><strong>← →:</strong> 5 saniye ileri/geri</p>
          <p><strong>Shift + ← →:</strong> 1 frame ileri/geri</p>
          <p><strong>C:</strong> Mevcut zamanda bölüm ekle</p>
        </div>
      </div>
    </div>
  );
}
