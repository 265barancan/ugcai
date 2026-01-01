/**
 * Video templates/presets for quick video creation
 */

import { VideoSettings } from "@/types";

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: "product" | "education" | "news" | "social" | "marketing" | "entertainment";
  icon: string;
  settings: VideoSettings;
  stylePrompt: string;
  exampleText?: string;
}

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: "product-showcase",
    name: "Ürün Tanıtımı",
    description: "Ürünlerinizi etkileyici şekilde tanıtın",
    category: "product",
    icon: "📦",
    settings: {
      duration: 15,
      resolution: "1080p",
      style: "professional",
    },
    stylePrompt: "A professional product showcase with clean background, modern lighting, and cinematic camera movements",
    exampleText: "Bu harika ürünü keşfedin! Yüksek kalite, uygun fiyat ve müşteri memnuniyeti garantisi.",
  },
  {
    id: "educational-tutorial",
    name: "Eğitim Videosu",
    description: "Bilgilendirici ve öğretici içerikler için",
    category: "education",
    icon: "📚",
    settings: {
      duration: 30,
      resolution: "1080p",
      style: "friendly",
    },
    stylePrompt: "An educational tutorial with clear explanations, friendly presenter, and informative visuals",
    exampleText: "Bugün size nasıl daha verimli çalışabileceğinizi göstereceğim. İlk olarak, zaman yönetimi tekniklerinden bahsedelim...",
  },
  {
    id: "news-announcement",
    name: "Haber Duyurusu",
    description: "Haber ve duyurular için profesyonel format",
    category: "news",
    icon: "📰",
    settings: {
      duration: 20,
      resolution: "1080p",
      style: "professional",
    },
    stylePrompt: "A news announcement with professional presenter, newsroom background, and authoritative tone",
    exampleText: "Önemli bir duyuru: Yeni özellikler ve güncellemeler hakkında bilgi vermek istiyoruz...",
  },
  {
    id: "social-media-short",
    name: "Sosyal Medya Kısa Video",
    description: "Instagram, TikTok için kısa ve etkileyici videolar",
    category: "social",
    icon: "📱",
    settings: {
      duration: 15,
      resolution: "1080p",
      style: "energetic",
    },
    stylePrompt: "A short, energetic social media video with vibrant colors, dynamic movements, and engaging visuals",
    exampleText: "Bu içeriği kaçırmayın! Hemen izleyin ve beğenmeyi unutmayın! 🎉",
  },
  {
    id: "marketing-promo",
    name: "Pazarlama Promosyonu",
    description: "Ürün ve hizmet promosyonları için",
    category: "marketing",
    icon: "🎯",
    settings: {
      duration: 30,
      resolution: "1080p",
      style: "energetic",
    },
    stylePrompt: "A marketing promotion with compelling visuals, persuasive presentation, and call-to-action",
    exampleText: "Özel fırsat! Sınırlı süre için %50 indirim. Hemen satın alın ve fırsatı kaçırmayın!",
  },
  {
    id: "entertainment-fun",
    name: "Eğlence Videosu",
    description: "Eğlenceli ve komik içerikler için",
    category: "entertainment",
    icon: "🎬",
    settings: {
      duration: 20,
      resolution: "1080p",
      style: "energetic",
    },
    stylePrompt: "An entertaining video with fun atmosphere, playful visuals, and engaging content",
    exampleText: "Bugün size çok komik bir hikaye anlatacağım. Hazır mısınız? O zaman başlayalım! 😄",
  },
];

export function getTemplateById(id: string): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: VideoTemplate["category"]): VideoTemplate[] {
  return VIDEO_TEMPLATES.filter((template) => template.category === category);
}

export function getAllCategories(): VideoTemplate["category"][] {
  return Array.from(new Set(VIDEO_TEMPLATES.map((t) => t.category)));
}
