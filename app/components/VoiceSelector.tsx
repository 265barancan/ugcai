"use client";

import { useState, useEffect, useMemo } from "react";
import { Voice, Language, TTSProvider } from "@/types";
import { logger } from "@/lib/logger";

interface VoiceSelectorProps {
  selectedVoiceId: string | null;
  onVoiceChange: (voiceId: string) => void;
  disabled?: boolean;
  provider?: TTSProvider;
}

// Known high-quality Turkish voice IDs from ElevenLabs
// User-provided Turkish voice IDs
const QUALITY_TURKISH_VOICE_IDS = [
  "krLzmW3By9JzaVy294Ux", // Turkish voice 1
  "fg8pljYEn5ahwjyOQaro", // Turkish voice 2
  "NNn9dv8zq2kUo7d3JSGG", // Turkish voice 3
  "5nr6ATQepuidiLb6OT3B", // Turkish voice 4
  "pMQM2vAjnEa9PmfDvgkY", // Turkish voice 5
  "n1k2o6h2qrpsjPldwAWN", // Turkish voice 6
  "1Iy00CVh3yqYLlZBmEFo", // Turkish voice 7
  "H9xk2HncwpOKhhzbyWsd", // Turkish voice 8
  "N0wraTTB0pquzsz3DLG8", // Turkish voice 9
];

// Known Turkish voice names/keywords
const TURKISH_VOICE_NAMES = [
  "turkish",
  "türkçe",
  "tr",
  "turkey",
  "turk",
  "multilingual", // Multilingual voices usually support Turkish well
];

// Known English voice names
const ENGLISH_VOICE_NAMES = [
  "english",
  "en",
  "us",
  "uk",
  "american",
  "british",
];

// Helper function to detect language from voice
function detectVoiceLanguage(voice: Voice): Language {
  const voiceId = voice.voice_id || "";
  
  // FIRST: Check if it's a known quality Turkish voice by ID (most reliable)
  if (QUALITY_TURKISH_VOICE_IDS.includes(voiceId)) {
    return "tr";
  }
  
  const name = voice.name.toLowerCase();
  const description = (voice.description || "").toLowerCase();
  const category = (voice.category || "").toLowerCase();
  const language = voice.labels?.language?.toLowerCase() || "";
  const allText = `${name} ${description} ${category} ${language}`;
  
  // Check for Turkish keywords
  if (TURKISH_VOICE_NAMES.some(keyword => allText.includes(keyword))) {
    return "tr";
  }
  
  // Check for English keywords
  if (ENGLISH_VOICE_NAMES.some(keyword => allText.includes(keyword))) {
    return "en";
  }
  
  // Check if multilingual (usually supports Turkish)
  if (allText.includes("multilingual") || language.includes("multilingual")) {
    // Multilingual voices can work with Turkish, but prioritize explicit Turkish
    return "tr";
  }
  
  // Default to English if no match (most voices are English)
  return "en";
}

// Helper function to check if voice is high-quality Turkish
function isQualityTurkishVoice(voice: Voice): boolean {
  return QUALITY_TURKISH_VOICE_IDS.includes(voice.voice_id);
}

export default function VoiceSelector({
  selectedVoiceId,
  onVoiceChange,
  disabled = false,
  provider = "elevenlabs",
}: VoiceSelectorProps) {
  const [allVoices, setAllVoices] = useState<Voice[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  
  // Filter voices based on selected language
  const filteredVoices = useMemo(() => {
    if (selectedLanguage === "all") {
      return allVoices;
    }
    
    const filtered = allVoices.filter(voice => {
      const detectedLang = detectVoiceLanguage(voice);
      const isTurkish = detectedLang === selectedLanguage;
      
      // Debug: Log Turkish voice detection (only in development)
      if (selectedLanguage === "tr") {
        if (QUALITY_TURKISH_VOICE_IDS.includes(voice.voice_id)) {
          logger.debug("✅ Turkish voice found (by ID):", voice.voice_id, voice.name);
        } else if (isTurkish) {
          logger.debug("✅ Turkish voice found (by detection):", voice.voice_id, voice.name);
        } else {
          // Log voices that are NOT detected as Turkish but might be
          const name = (voice.name || "").toLowerCase();
          const desc = (voice.description || "").toLowerCase();
          if (name.includes("turk") || desc.includes("turk")) {
            logger.debug("⚠️ Voice might be Turkish but not detected:", voice.voice_id, voice.name);
          }
        }
      }
      
      return isTurkish;
    });
    
    // Debug: Log filtering results (only in development)
    if (selectedLanguage === "tr") {
      logger.debug("📊 Filtering Results:");
      logger.debug("  Total voices:", allVoices.length);
      logger.debug("  Turkish voices found:", filtered.length);
      logger.debug("  Expected Turkish voice IDs:", QUALITY_TURKISH_VOICE_IDS);
      logger.debug("  Found Turkish voice IDs:", filtered.map(v => v.voice_id));
      logger.debug("  Missing Turkish voice IDs:", QUALITY_TURKISH_VOICE_IDS.filter(id => !allVoices.some(v => v.voice_id === id)));
    }
    
    return filtered;
  }, [allVoices, selectedLanguage]);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        setError(null);
        setAllVoices([]);
        setSelectedLanguage("all"); // Reset language filter when provider changes
        
        const response = await fetch(`/api/voices?provider=${provider}`);
        const data = await response.json();

        if (data.success && data.voices) {
          // For ElevenLabs, check Turkish voices
          if (provider === "elevenlabs") {
            const availableTurkishVoices = data.voices.filter((v: Voice) => 
              QUALITY_TURKISH_VOICE_IDS.includes(v.voice_id)
            );
            
            const potentialTurkishVoices = data.voices.filter((v: Voice) => {
              const name = (v.name || "").toLowerCase();
              const desc = (v.description || "").toLowerCase();
              const cat = (v.category || "").toLowerCase();
              const text = `${name} ${desc} ${cat}`;
              return text.includes("turkish") || text.includes("türkçe") || text.includes("tr");
            });
            
            logger.debug("Available Turkish voices from API (by ID):", availableTurkishVoices.length);
            logger.debug("Turkish voice IDs found:", availableTurkishVoices.map((v: Voice) => v.voice_id));
            logger.debug("Potential Turkish voices (by name/desc):", potentialTurkishVoices.length);
          }
          
          // Set all voices
          setAllVoices(data.voices);
          
          // Auto-select first voice if none selected or provider changed
          if (data.voices.length > 0) {
            // For ElevenLabs, try to find Turkish voice first
            if (provider === "elevenlabs") {
              const qualityTurkishVoice = data.voices.find((v: Voice) => 
                isQualityTurkishVoice(v)
              );
              const premiumVoice = data.voices.find((v: Voice) => 
                v.category === 'premade' || v.category === 'premium' || !v.category
              );
              const voiceToSelect = qualityTurkishVoice || premiumVoice || data.voices[0];
              onVoiceChange(voiceToSelect.voice_id);
            } else {
              // For other providers, select first voice
              onVoiceChange(data.voices[0].voice_id);
            }
            setHasInitialized(true);
          }
        } else {
          setError(data.error || "Sesler yüklenemedi");
        }
      } catch (err: any) {
        setError(err.message || "Sesler yüklenirken bir hata oluştu");
        logger.error("Error fetching voices:", err);
      } finally {
        setLoading(false);
      }
    };

    if (provider) {
      fetchVoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]); // Re-fetch when provider changes

  // When language changes, if selected voice is not in filtered list, select first available
  useEffect(() => {
    if (filteredVoices.length > 0 && selectedVoiceId) {
      const isSelectedVoiceAvailable = filteredVoices.some(v => v.voice_id === selectedVoiceId);
      if (!isSelectedVoiceAvailable) {
        onVoiceChange(filteredVoices[0].voice_id);
      }
    } else if (filteredVoices.length > 0 && !selectedVoiceId) {
      onVoiceChange(filteredVoices[0].voice_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, filteredVoices]);

  const handlePreview = async (voiceId: string) => {
    if (previewingVoiceId === voiceId && previewAudioUrl) {
      // If already previewing this voice, stop it
      setPreviewingVoiceId(null);
      setPreviewAudioUrl(null);
      return;
    }

    try {
      setPreviewingVoiceId(voiceId);
      setPreviewAudioUrl(null);

      const voice = allVoices.find(v => v.voice_id === voiceId);
      const voiceLanguage = voice ? detectVoiceLanguage(voice) : "en";

      const response = await fetch("/api/preview-voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceId,
          language: voiceLanguage,
        }),
      });

      const data = await response.json();

      if (data.success && data.audioUrl) {
        setPreviewAudioUrl(data.audioUrl);
      } else {
        throw new Error(data.error || "Önizleme oluşturulamadı");
      }
    } catch (err: any) {
      logger.error("Preview error:", err);
      setPreviewingVoiceId(null);
      setPreviewAudioUrl(null);
      alert(err.message || "Önizleme yüklenirken bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dil Seçin
          </label>
          <div className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 animate-pulse">
            <p className="text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ses Seçin
          </label>
          <div className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 animate-pulse">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sesler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ses Seçin
        </label>
        <div className="px-4 py-3 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="space-y-2">
        <label
          htmlFor="language-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Dil Seçin
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as Language)}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="all">Tüm Diller</option>
          <option value="tr">Türkçe</option>
          <option value="en">İngilizce</option>
        </select>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <label
          htmlFor="voice-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Ses Seçin
        </label>
        <div className="space-y-2">
          <select
            id="voice-select"
            value={selectedVoiceId || ""}
            onChange={(e) => onVoiceChange(e.target.value)}
            disabled={disabled || filteredVoices.length === 0}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {filteredVoices.length === 0 ? (
              <option value="">
                {selectedLanguage === "all" 
                  ? "Ses bulunamadı" 
                  : `${selectedLanguage === "tr" ? "Türkçe" : "İngilizce"} ses bulunamadı`}
              </option>
            ) : (
              filteredVoices.map((voice) => {
                const language = detectVoiceLanguage(voice);
                const languageLabel = language === "tr" ? "🇹🇷" : language === "en" ? "🇬🇧" : "🌐";
                return (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {languageLabel} {voice.name} {voice.category ? `(${voice.category})` : ""}
                  </option>
                );
              })
            )}
          </select>
          
          {/* Preview Button */}
          {selectedVoiceId && filteredVoices.length > 0 && (
            <button
              onClick={() => handlePreview(selectedVoiceId)}
              disabled={disabled || previewingVoiceId === selectedVoiceId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {previewingVoiceId === selectedVoiceId && !previewAudioUrl ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Yükleniyor...</span>
                </>
              ) : previewAudioUrl && previewingVoiceId === selectedVoiceId ? (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Önizleme Oynatılıyor</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Sesi Önizle</span>
                </>
              )}
            </button>
          )}

          {/* Audio Player */}
          {previewAudioUrl && previewingVoiceId === selectedVoiceId && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <audio
                controls
                autoPlay
                className="w-full"
                onEnded={() => {
                  setPreviewingVoiceId(null);
                  setPreviewAudioUrl(null);
                }}
              >
                <source src={previewAudioUrl} type="audio/mpeg" />
                Tarayıcınız ses oynatmayı desteklemiyor.
              </audio>
            </div>
          )}
        </div>

        {selectedVoiceId && filteredVoices.find((v) => v.voice_id === selectedVoiceId)?.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredVoices.find((v) => v.voice_id === selectedVoiceId)?.description}
          </p>
        )}
        {filteredVoices.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredVoices.length} ses bulundu
          </p>
        )}
      </div>
    </div>
  );
}

