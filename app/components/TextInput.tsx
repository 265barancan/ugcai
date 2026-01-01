"use client";

import { validateText, sanitizeText, estimateVideoDuration } from "@/lib/validation";
import AITextSuggestions from "./AITextSuggestions";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

export default function TextInput({
  value,
  onChange,
  onGenerate,
  disabled = false,
}: TextInputProps) {
  const validation = validateText(value);
  const sanitizedValue = value ? sanitizeText(value) : "";
  const estimatedDuration = value ? estimateVideoDuration(value) : 0;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && validation.valid) {
      // Use sanitized value
      if (sanitizedValue !== value) {
        onChange(sanitizedValue);
      }
      onGenerate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AITextSuggestions
        currentText={value}
        onSuggestionSelect={onChange}
        disabled={disabled}
      />
      
      <div>
        <label
          htmlFor="text-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Video Metni
        </label>
        <textarea
          id="text-input"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          rows={6}
          maxLength={5000}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
            value && !validation.valid
              ? "border-red-300 dark:border-red-600"
              : "border-gray-300 dark:border-gray-600"
          }`}
          placeholder="Video için metninizi buraya yazın..."
        />
        <div className="mt-2 flex justify-between items-center">
          <div>
            <p className={`text-sm ${value && !validation.valid ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
              {value.length} / 5000 karakter
              {estimatedDuration > 0 && (
                <span className="ml-2">
                  (Tahmini süre: ~{estimatedDuration}s)
                </span>
              )}
            </p>
            {value && !validation.valid && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {validation.error}
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || !validation.valid}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {disabled ? "Oluşturuluyor..." : "Video Oluştur"}
      </button>
    </form>
  );
}

