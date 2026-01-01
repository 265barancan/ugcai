"use client";

import { useState } from "react";
import AIModelSelector from "./AIModelSelector";
import { AIModel } from "@/types";
import { useToast } from "./ToastContainer";

interface AITextSuggestionsProps {
  currentText: string;
  onSuggestionSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export default function AITextSuggestions({
  currentText,
  onSuggestionSelect,
  disabled = false,
}: AITextSuggestionsProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const handleGenerateSuggestion = async () => {
    if (!currentText.trim() || currentText.length < 10) {
      showError("Metin önerisi için en az 10 karakter gerekli");
      return;
    }

    setLoading(true);
    setSuggestion(null);

    try {
      const response = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          type: "text-suggestion",
          text: currentText,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Metin önerisi oluşturulamadı");
      }

      setSuggestion(data.result);
      success("Metin önerisi oluşturuldu!");
    } catch (err: any) {
      showError(err.message || "Metin önerisi oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">✨</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Metin Önerileri
        </h3>
      </div>

      <AIModelSelector
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        disabled={disabled || loading}
      />

      <button
        onClick={handleGenerateSuggestion}
        disabled={disabled || loading || !currentText.trim() || currentText.length < 10}
        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Öneri Oluşturuluyor...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>AI ile Metin Önerisi Al</span>
          </>
        )}
      </button>

      {suggestion && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Önerilen Metin:</h4>
            <button
              onClick={() => setSuggestion(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
            {suggestion}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onSuggestionSelect(suggestion);
                setSuggestion(null);
                success("Metin güncellendi!");
              }}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              ✓ Bu Metni Kullan
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

