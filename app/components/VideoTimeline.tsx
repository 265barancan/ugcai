"use client";

import { useState, useRef, useEffect } from "react";

interface VideoTimelineProps {
  videoUrl: string;
  videoDuration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  chapters?: VideoChapter[];
  onChapterAdd?: (time: number, title: string) => void;
  onChapterDelete?: (id: string) => void;
  onChapterUpdate?: (id: string, time: number, title: string) => void;
}

export interface VideoChapter {
  id: string;
  time: number;
  title: string;
}

export default function VideoTimeline({
  videoUrl,
  videoDuration,
  currentTime,
  onSeek,
  chapters = [],
  onChapterAdd,
  onChapterDelete,
  onChapterUpdate,
}: VideoTimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterTime, setNewChapterTime] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.max(0, Math.min(videoDuration, percentage * videoDuration));
    
    onSeek(newTime);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = Math.max(0, Math.min(videoDuration, percentage * videoDuration));
    
    setHoverTime(time);
  };

  const handleAddChapter = () => {
    if (newChapterTitle.trim() && onChapterAdd) {
      onChapterAdd(newChapterTime || currentTime, newChapterTitle.trim());
      setNewChapterTitle("");
      setNewChapterTime(0);
      setShowChapterForm(false);
    }
  };

  const percentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </span>
          {hoverTime !== null && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(hoverTime)}
            </span>
          )}
        </div>

        {/* Timeline Bar */}
        <div
          ref={timelineRef}
          className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Progress Bar */}
          <div
            className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-100"
            style={{ width: `${percentage}%` }}
          />

          {/* Chapters Markers */}
          {chapters.map((chapter) => {
            const chapterPercentage = (chapter.time / videoDuration) * 100;
            return (
              <div
                key={chapter.id}
                className="absolute top-0 h-full w-1 bg-yellow-500 cursor-pointer hover:bg-yellow-400 transition-colors"
                style={{ left: `${chapterPercentage}%` }}
                title={chapter.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(chapter.time);
                }}
              />
            );
          })}

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 h-full w-1 bg-white dark:bg-gray-300 shadow-lg cursor-pointer hover:w-2 transition-all"
            style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
          />

          {/* Hover Indicator */}
          {hoverTime !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400 opacity-50 pointer-events-none"
              style={{ left: `${(hoverTime / videoDuration) * 100}%` }}
            />
          )}
        </div>

        {/* Chapter Labels */}
        {chapters.length > 0 && (
          <div className="relative h-6 mt-2">
            {chapters.map((chapter) => {
              const chapterPercentage = (chapter.time / videoDuration) * 100;
              return (
                <div
                  key={chapter.id}
                  className="absolute text-xs text-yellow-600 dark:text-yellow-400 font-medium"
                  style={{ left: `${chapterPercentage}%`, transform: "translateX(-50%)" }}
                >
                  {chapter.title}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chapter Management */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Bölümler (Chapters) ({chapters.length})
          </h4>
          <button
            onClick={() => setShowChapterForm(!showChapterForm)}
            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
          >
            {showChapterForm ? "✕ İptal" : "+ Bölüm Ekle"}
          </button>
        </div>

        {showChapterForm && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Bölüm başlığı"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max={videoDuration}
                step="0.1"
                value={newChapterTime}
                onChange={(e) => setNewChapterTime(Number(e.target.value))}
                placeholder="Zaman (saniye)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />
              <button
                onClick={() => setNewChapterTime(currentTime)}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs"
              >
                Mevcut Zaman
              </button>
            </div>
            <button
              onClick={handleAddChapter}
              disabled={!newChapterTitle.trim()}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              Bölüm Ekle
            </button>
          </div>
        )}

        {/* Chapters List */}
        {chapters.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {chapters
              .sort((a, b) => a.time - b.time)
              .map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">●</span>
                    <span className="text-gray-700 dark:text-gray-300">{chapter.title}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      ({formatTime(chapter.time)})
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onSeek(chapter.time)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      title="Git"
                    >
                      ▶
                    </button>
                    {onChapterDelete && (
                      <button
                        onClick={() => onChapterDelete(chapter.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        title="Sil"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
