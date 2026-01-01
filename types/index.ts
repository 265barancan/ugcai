export interface VideoGenerationRequest {
  text: string;
  voiceId?: string;
  videoPrompt?: string;
}

export interface AudioGenerationResponse {
  audioUrl: string;
  success: boolean;
  error?: string;
}

export interface VideoGenerationResponse {
  videoUrl?: string;
  predictionId?: string;
  success: boolean;
  error?: string;
  status?: string;
}

export interface VideoStatusResponse {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string;
  error?: string;
  progress?: number;
  logs?: string;
  success: boolean;
}

export interface GenerationStatus {
  status: 'idle' | 'generating-audio' | 'generating-video' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

export interface VideoSettings {
  duration: number;
  resolution: "720p" | "1080p" | "4K";
  style: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
    use_case?: string;
    language?: string;
  };
}

export type Language = "tr" | "en" | "all";

export interface VideoHistoryItem {
  id: string;
  videoUrl: string;
  audioUrl?: string;
  text: string;
  voiceId?: string;
  voiceName?: string;
  settings?: VideoSettings;
  createdAt: number;
  isFavorite?: boolean;
  thumbnail?: string;
}

export type AIModel = "gemini" | "grok" | "deepseek";

export type VideoProvider = "replicate" | "fal" | "huggingface";

export interface VideoProviderConfig {
  provider: VideoProvider;
  name: string;
  description: string;
  icon: string;
  requiresApiKey: boolean;
  apiKeyEnv?: string;
  supportsAudio?: boolean; // Whether the provider supports audio synchronization
  audioSupportNote?: string; // Additional note about audio support
}

export interface BatchVideoItem {
  id: string;
  text: string;
  status: "pending" | "generating-audio" | "generating-video" | "completed" | "error";
  progress?: number;
  videoUrl?: string;
  audioUrl?: string;
  error?: string;
  predictionId?: string;
  createdAt: number;
  completedAt?: number;
}

export interface BatchVideoJob {
  id: string;
  items: BatchVideoItem[];
  totalCount: number;
  completedCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed" | "error";
  createdAt: number;
  completedAt?: number;
}

export interface AISuggestionRequest {
  model: AIModel;
  prompt: string;
  context?: string;
}

export interface AISuggestionResponse {
  success: boolean;
  suggestion?: string;
  error?: string;
}

export type ExportFormat = "mp4" | "webm" | "gif";
export type ExportQuality = "low" | "medium" | "high" | "original";
export type ExportFrameRate = 24 | 30 | 60;

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  frameRate?: ExportFrameRate;
  width?: number;
  height?: number;
}

export interface AnalyticsData {
  totalVideos: number;
  totalDuration: number; // in seconds
  totalStorage: number; // in bytes
  videosByDay: { date: string; count: number }[];
  videosByProvider: { provider: VideoProvider; count: number }[];
  averageGenerationTime: number; // in seconds
  successRate: number; // percentage
  last30Days: {
    date: string;
    videos: number;
    duration: number;
  }[];
}

export type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
export type WatermarkType = "text" | "image";

export interface WatermarkOptions {
  enabled: boolean;
  type: WatermarkType;
  text?: string;
  imageUrl?: string;
  position: WatermarkPosition;
  opacity: number; // 0-1
  size: number; // percentage of video size (10-50)
  margin: number; // pixels
}

export type TTSProvider = "elevenlabs" | "edgetts" | "google" | "azure";

export interface TTSProviderConfig {
  provider: TTSProvider;
  name: string;
  description: string;
  icon: string;
  isFree: boolean;
  freeLimit?: string;
  requiresApiKey: boolean;
  apiKeyEnv?: string;
}
