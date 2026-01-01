/**
 * Batch video processing utilities
 */

import { BatchVideoItem, BatchVideoJob } from "@/types";
import { logger } from "./logger";

const STORAGE_KEY = "batch_jobs";
const MAX_BATCH_JOBS = 10; // Maximum number of batch jobs to keep in history

export function createBatchJob(texts: string[]): BatchVideoJob {
  const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const items: BatchVideoItem[] = texts.map((text, index) => ({
    id: `item_${jobId}_${index}`,
    text: text.trim(),
    status: "pending",
    createdAt: Date.now(),
  }));

  const job: BatchVideoJob = {
    id: jobId,
    items,
    totalCount: items.length,
    completedCount: 0,
    failedCount: 0,
    status: "pending",
    createdAt: Date.now(),
  };

  // Save to localStorage
  saveBatchJob(job);

  return job;
}

export function saveBatchJob(job: BatchVideoJob): void {
  try {
    const jobs = getBatchJobs();
    jobs.unshift(job);

    // Limit history size
    if (jobs.length > MAX_BATCH_JOBS) {
      jobs.splice(MAX_BATCH_JOBS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    logger.error("Error saving batch job:", error);
  }
}

export function getBatchJobs(): BatchVideoJob[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const jobs = JSON.parse(stored) as BatchVideoJob[];
    return jobs.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    logger.error("Error reading batch jobs:", error);
    return [];
  }
}

export function getBatchJob(jobId: string): BatchVideoJob | null {
  const jobs = getBatchJobs();
  return jobs.find((job) => job.id === jobId) || null;
}

export function updateBatchJob(jobId: string, updates: Partial<BatchVideoJob>): boolean {
  try {
    const jobs = getBatchJobs();
    const jobIndex = jobs.findIndex((job) => job.id === jobId);
    
    if (jobIndex === -1) return false;

    jobs[jobIndex] = { ...jobs[jobIndex], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch (error) {
    logger.error("Error updating batch job:", error);
    return false;
  }
}

export function updateBatchItem(
  jobId: string,
  itemId: string,
  updates: Partial<BatchVideoItem>
): boolean {
  try {
    const jobs = getBatchJobs();
    const jobIndex = jobs.findIndex((job) => job.id === jobId);
    
    if (jobIndex === -1) return false;

    const itemIndex = jobs[jobIndex].items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return false;

    jobs[jobIndex].items[itemIndex] = { ...jobs[jobIndex].items[itemIndex], ...updates };
    
    // Update job statistics
    const completedCount = jobs[jobIndex].items.filter((item) => item.status === "completed").length;
    const failedCount = jobs[jobIndex].items.filter((item) => item.status === "error").length;
    const processingCount = jobs[jobIndex].items.filter(
      (item) => item.status === "generating-audio" || item.status === "generating-video"
    ).length;

    jobs[jobIndex].completedCount = completedCount;
    jobs[jobIndex].failedCount = failedCount;

    if (completedCount + failedCount === jobs[jobIndex].totalCount) {
      jobs[jobIndex].status = "completed";
      jobs[jobIndex].completedAt = Date.now();
    } else if (processingCount > 0) {
      jobs[jobIndex].status = "processing";
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch (error) {
    logger.error("Error updating batch item:", error);
    return false;
  }
}

export function deleteBatchJob(jobId: string): boolean {
  try {
    const jobs = getBatchJobs();
    const filtered = jobs.filter((job) => job.id !== jobId);
    
    if (filtered.length === jobs.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    logger.error("Error deleting batch job:", error);
    return false;
  }
}

export function clearBatchJobs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error("Error clearing batch jobs:", error);
  }
}

