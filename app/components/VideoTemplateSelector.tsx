"use client";

import { useState } from "react";
import { VideoTemplate, VIDEO_TEMPLATES, getAllCategories, getTemplatesByCategory } from "@/lib/videoTemplates";
import { VideoSettings } from "@/types";

interface VideoTemplateSelectorProps {
  onTemplateSelect: (template: VideoTemplate) => void;
  disabled?: boolean;
}

export default function VideoTemplateSelector({
  onTemplateSelect,
  disabled = false,
}: VideoTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<VideoTemplate["category"] | "all">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);

  const categories = getAllCategories();
  const templates = selectedCategory === "all" 
    ? VIDEO_TEMPLATES 
    : getTemplatesByCategory(selectedCategory);

  const handleTemplateClick = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Video Şablonu (Opsiyonel)
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Hızlı başlangıç için hazır şablonlardan birini seçin veya özel ayarlar yapın.
        </p>

        {/* Category Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            disabled={disabled}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Tümü
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              disabled={disabled}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {category === "product" && "📦 Ürün"}
              {category === "education" && "📚 Eğitim"}
              {category === "news" && "📰 Haber"}
              {category === "social" && "📱 Sosyal Medya"}
              {category === "marketing" && "🎯 Pazarlama"}
              {category === "entertainment" && "🎬 Eğlence"}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              disabled={disabled}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedTemplate?.id === template.id
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {template.settings.duration}s
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {template.settings.resolution}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {template.settings.style}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Template Info */}
        {selectedTemplate && (
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{selectedTemplate.icon}</span>
              <div>
                <h4 className="font-bold text-purple-900 dark:text-purple-200">
                  {selectedTemplate.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
              </div>
            </div>
            {selectedTemplate.exampleText && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Örnek Metin:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{selectedTemplate.exampleText}"
                </p>
              </div>
            )}
            <div className="mt-3 flex gap-2 text-xs">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
                Süre: {selectedTemplate.settings.duration}s
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                Çözünürlük: {selectedTemplate.settings.resolution}
              </span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded">
                Stil: {selectedTemplate.settings.style}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
