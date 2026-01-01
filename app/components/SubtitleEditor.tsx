"use client";

import { useState, useEffect } from "react";
import {
  SubtitleEntry,
  generateSubtitlesFromText,
  subtitlesToSRT,
  subtitlesToVTT,
  downloadSubtitleFile,
} from "@/lib/subtitles";

interface SubtitleEditorProps {
  videoText: string;
  videoDuration: number;
  onSave?: (subtitles: SubtitleEntry[]) => void;
  onCancel?: () => void;
}

export default function SubtitleEditor({
  videoText,
  videoDuration,
  onSave,
  onCancel,
}: SubtitleEditorProps) {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [wordsPerMinute, setWordsPerMinute] = useState(150);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    // Auto-generate subtitles when text or duration changes
    if (videoText && videoDuration > 0) {
      const generated = generateSubtitlesFromText(
        videoText,
        videoDuration,
        wordsPerMinute
      );
      setSubtitles(generated);
    }
  }, [videoText, videoDuration, wordsPerMinute]);

  const handleRegenerate = () => {
    const generated = generateSubtitlesFromText(
      videoText,
      videoDuration,
      wordsPerMinute
    );
    setSubtitles(generated);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditingText(subtitles[index].text);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updated = [...subtitles];
      updated[editingIndex] = {
        ...updated[editingIndex],
        text: editingText,
      };
      setSubtitles(updated);
      setEditingIndex(null);
      setEditingText("");
    }
  };

  const handleDelete = (index: number) => {
    const updated = subtitles.filter((_, i) => i !== index);
    setSubtitles(updated);
  };

  const handleAdd = () => {
    const newSubtitle: SubtitleEntry = {
      start: videoDuration / 2,
      end: videoDuration / 2 + 2,
      text: "Yeni altyazı metni",
    };
    setSubtitles([...subtitles, newSubtitle].sort((a, b) => a.start - b.start));
  };

  const handleDownloadSRT = () => {
    const srtContent = subtitlesToSRT(subtitles);
    downloadSubtitleFile(srtContent, "video-subtitles", "srt");
  };

  const handleDownloadVTT = () => {
    const vttContent = subtitlesToVTT(subtitles);
    downloadSubtitleFile(vttContent, "video-subtitles", "vtt");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Altyazı Düzenleyici
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
              onClick={() => onSave(subtitles)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Kaydet
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Kelime Hızı (dakikada):
          </label>
          <input
            type="number"
            min="100"
            max="300"
            value={wordsPerMinute}
            onChange={(e) => setWordsPerMinute(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleRegenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Yeniden Oluştur
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            ➕ Altyazı Ekle
          </button>
        </div>
      </div>

      {/* Subtitle List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {subtitles.map((subtitle, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            {editingIndex === index ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={subtitle.start}
                    onChange={(e) => {
                      const updated = [...subtitles];
                      updated[index].start = Number(e.target.value);
                      setSubtitles(updated);
                    }}
                    className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    step="0.1"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={subtitle.end}
                    onChange={(e) => {
                      const updated = [...subtitles];
                      updated[index].end = Number(e.target.value);
                      setSubtitles(updated);
                    }}
                    className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    step="0.1"
                  />
                </div>
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => {
                      setEditingIndex(null);
                      setEditingText("");
                    }}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {subtitle.start.toFixed(1)}s - {subtitle.end.toFixed(1)}s
                  </div>
                  <p className="text-gray-900 dark:text-white">{subtitle.text}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(index)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Download Buttons */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={handleDownloadSRT}
          disabled={subtitles.length === 0}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 SRT İndir
        </button>
        <button
          onClick={handleDownloadVTT}
          disabled={subtitles.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 VTT İndir
        </button>
      </div>

      {subtitles.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Altyazı oluşturmak için video metni ve süresi gereklidir.
          </p>
        </div>
      )}
    </div>
  );
}
