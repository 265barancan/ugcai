"use client";

import { useState } from "react";

interface VideoTranscriberProps {
  videoUrl: string;
  onSave?: (transcript: string) => void;
  onCancel?: () => void;
}

export default function VideoTranscriber({
  videoUrl,
  onSave,
  onCancel,
}: VideoTranscriberProps) {
  const [provider, setProvider] = useState<"huggingface" | "azure" | "google">("huggingface");
  const [language, setLanguage] = useState("tr");
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTranscribe = async () => {
    setProcessing(true);
    setError(null);
    setTranscript(null);

    try {
      // First, extract audio from video using FFmpeg (client-side)
      const { getFFmpeg, fetchFile } = await import("@/lib/ffmpeg");
      const ffmpeg = await getFFmpeg();

      const inputFileName = "input.mp4";
      const outputFileName = "output.mp3";

      // Download video file
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));

      // Extract audio
      await ffmpeg.exec([
        "-i", inputFileName,
        "-vn", // No video
        "-acodec", "libmp3lame", // MP3 codec
        "-ar", "16000", // Sample rate
        "-ac", "1", // Mono
        outputFileName,
      ]);

      // Read audio file
      const audioData = await ffmpeg.readFile(outputFileName);
      const uint8Array = audioData instanceof Uint8Array 
        ? audioData 
        : new Uint8Array(audioData as any);
      
      // Convert to base64
      const base64 = btoa(
        String.fromCharCode(...uint8Array)
      );

      // Clean up
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      // Send to API
      const response = await fetch("/api/transcribe-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioBase64: base64,
          provider,
          language,
        }),
      });

      const data = await response.json();

      if (data.success && data.transcript) {
        setTranscript(data.transcript);
      } else {
        setError(data.error || "Transkript oluşturulamadı");
      }
    } catch (err: any) {
      console.error("Error transcribing video:", err);
      setError("Transkript oluşturulurken bir hata oluştu: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!transcript) return;

    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transcript-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = () => {
    if (onSave && transcript) {
      onSave(transcript);
    }
  };

  const languages = [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "İngilizce" },
    { code: "de", name: "Almanca" },
    { code: "fr", name: "Fransızca" },
    { code: "es", name: "İspanyolca" },
    { code: "it", name: "İtalyanca" },
    { code: "pt", name: "Portekizce" },
    { code: "ru", name: "Rusça" },
    { code: "ar", name: "Arapça" },
    { code: "zh", name: "Çince" },
    { code: "ja", name: "Japonca" },
    { code: "ko", name: "Korece" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Video Transkript Oluşturucu
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
          {onSave && transcript && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Kaydet
            </button>
          )}
        </div>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sağlayıcı Seçimi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              value: "huggingface" as const,
              name: "Hugging Face Whisper",
              description: "Ücretsiz, açık kaynak AI modeli",
              icon: "🤗",
            },
            {
              value: "azure" as const,
              name: "Azure Speech",
              description: "Yüksek doğruluk, ücretli",
              icon: "☁️",
              disabled: true,
            },
            {
              value: "google" as const,
              name: "Google Cloud",
              description: "Profesyonel kalite, ücretli",
              icon: "🔊",
              disabled: true,
            },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => !p.disabled && setProvider(p.value)}
              disabled={p.disabled}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                provider === p.value
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
              } ${p.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {p.name}
                    {p.disabled && <span className="text-xs text-gray-500 ml-2">(Yakında)</span>}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {p.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dil Seçimi
        </h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transcribe Button */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleTranscribe}
          disabled={processing}
          className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {processing ? "Transkript oluşturuluyor..." : "Transkript Oluştur"}
        </button>
        {transcript && (
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            📥 İndir
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
            Transkript
          </h4>
          <textarea
            value={transcript}
            readOnly
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {transcript.length} karakter, {transcript.split(/\s+/).length} kelime
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 İpucu:</strong> Video'dan ses çıkarılır ve AI ile transkript oluşturulur. 
          İşlem video uzunluğuna bağlı olarak birkaç dakika sürebilir.
        </p>
      </div>
    </div>
  );
}
