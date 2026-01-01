"use client";

import { GenerationStatus } from "@/types";

interface LoadingStateProps {
  status: GenerationStatus;
}

export default function LoadingState({ status }: LoadingStateProps) {
  const progress = status.progress ?? 0;
  
  return (
    <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <div className="flex-1">
          <p className="text-blue-800 dark:text-blue-200 font-medium">
            {status.message || "İşlem devam ediyor..."}
          </p>
          {status.status === "generating-video" && (
            <div className="mt-3 space-y-2">
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 h-3 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 15 && (
                    <span className="text-xs font-semibold text-white">
                      {progress}%
                    </span>
                  )}
                </div>
              </div>
              {progress > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  İlerleme: {progress}%
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

