"use client";

import { AIModel } from "@/types";

interface AIModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
}

const models: { value: AIModel; name: string; description: string; icon: string }[] = [
  {
    value: "gemini",
    name: "Google Gemini",
    description: "Google'ın gelişmiş AI modeli",
    icon: "🤖",
  },
  {
    value: "grok",
    name: "Grok (xAI)",
    description: "xAI'nin güçlü AI modeli",
    icon: "🚀",
  },
  {
    value: "deepseek",
    name: "DeepSeek",
    description: "Yüksek performanslı AI modeli",
    icon: "⚡",
  },
];

export default function AIModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: AIModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        AI Modeli
      </label>
      <div className="grid grid-cols-3 gap-2">
        {models.map((model) => (
          <button
            key={model.value}
            type="button"
            onClick={() => onModelChange(model.value)}
            disabled={disabled}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedModel === model.value
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={model.description}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">{model.icon}</span>
              <span className="text-xs">{model.name}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {models.find((m) => m.value === selectedModel)?.description}
      </p>
    </div>
  );
}

