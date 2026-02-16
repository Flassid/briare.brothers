/**
 * Asset Generation Queue
 * Handles async generation with priority queue and WebSocket notifications
 */

import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { v4 as uuidv4 } from 'uuid';
import type {
  GenerationJob,
  GenerationRequest,
  GenerationResult,
  GenerationStatus,
  ArtServiceEvents
} from './types.js';

interface QueuedJob extends GenerationJob {
  resolve: (result: GenerationResult) => void;
  reject: (error: Error) => void;
}

export class AssetQueue extends EventEmitter {
  private queue: PQueue;
  private jobs: Map<string, QueuedJob> = new Map();
  private maxRetries: number;
  private timeoutMs: number;

  constructor(
    concurrency: number = 3,
    timeoutMs: number = 30000,
    maxRetries: number = 2
  ) {
    super();
    
    this.queue = new PQueue({
      concurrency,
      timeout: timeoutMs,
      throwOnTimeout: true
    });
    
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Add a generation request to the queue
   */
  async enqueue(
    request: GenerationRequest,
    executor: (job: GenerationJob) => Promise<GenerationResult>
  ): Promise<{ job: GenerationJob; promise: Promise<GenerationResult> }> {
    const jobId = uuidv4();
    
    const job: GenerationJob = {
      id: jobId,
      request,
      status: 'queued',
      createdAt: new Date(),
      attempts: 0
    };

    // Create promise that will resolve when job completes
    let resolve!: (result: GenerationResult) => void;
    let reject!: (error: Error) => void;
    
    const promise = new Promise<GenerationResult>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const queuedJob: QueuedJob = {
      ...job,
      resolve,
      reject
    };

    this.jobs.set(jobId, queuedJob);
    
    // Emit queued event
    this.emit('job:queued', job);

    // Add to queue
    this.queue.add(async () => {
      await this.processJob(queuedJob, executor);
    }, {
      priority: this.getPriority(request.priority)
    });

    return { job, promise };
  }

  /**
   * Process a single job
   */
  private async processJob(
    job: QueuedJob,
    executor: (job: GenerationJob) => Promise<GenerationResult>
  ): Promise<void> {
    job.status = 'generating';
    job.startedAt = new Date();
    job.attempts++;
    
    this.emit('job:started', job as GenerationJob);

    try {
      const result = await executor(job);
      
      job.status = 'complete';
      job.completedAt = new Date();
      job.result = result;
      
      this.emit('job:complete', job as GenerationJob, result);
      job.resolve(result);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Retry logic
      if (job.attempts < this.maxRetries) {
        console.log(`[Queue] Job ${job.id} failed, retrying (${job.attempts}/${this.maxRetries})`);
        job.status = 'queued';
        
        // Re-add to queue with delay
        await new Promise(r => setTimeout(r, 1000 * job.attempts));
        return this.processJob(job, executor);
      }
      
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = err.message;
      
      this.emit('job:failed', job as GenerationJob, err);
      job.reject(err);
      
    } finally {
      // Clean up after some time
      setTimeout(() => {
        this.jobs.delete(job.id);
      }, 5 * 60 * 1000); // Keep for 5 minutes
    }
  }

  /**
   * Get priority value (lower = higher priority)
   */
  private getPriority(priority?: string): number {
    switch (priority) {
      case 'high': return 0;
      case 'normal': return 1;
      case 'low': return 2;
      default: return 1;
    }
  }

  /**
   * Get job status
   */
  getJob(jobId: string): GenerationJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    
    // Return without internal resolve/reject
    const { resolve: _r, reject: _j, ...publicJob } = job;
    return publicJob;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): GenerationJob[] {
    return Array.from(this.jobs.values()).map(({ resolve: _r, reject: _j, ...job }) => job);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    pending: number;
    active: number;
    completed: number;
    failed: number;
    size: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      pending: this.queue.pending,
      active: jobs.filter(j => j.status === 'generating').length,
      completed: jobs.filter(j => j.status === 'complete').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      size: this.queue.size
    };
  }

  /**
   * Get position in queue
   */
  getPosition(jobId: string): number {
    const jobs = this.getAllJobs()
      .filter(j => j.status === 'queued')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const index = jobs.findIndex(j => j.id === jobId);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * Estimated wait time for a job
   */
  getEstimatedWait(jobId: string): number {
    const position = this.getPosition(jobId);
    if (position === -1) return 0;
    
    // Rough estimate: 5 seconds per job ahead
    const activeTime = 2500; // Average time for current active jobs
    const queuedTime = (position - 1) * 5000;
    
    return activeTime + queuedTime;
  }

  /**
   * Cancel a job
   */
  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') {
      return false;
    }
    
    job.status = 'failed';
    job.error = 'Cancelled';
    job.reject(new Error('Job cancelled'));
    this.jobs.delete(jobId);
    
    return true;
  }

  /**
   * Clear completed and failed jobs
   */
  cleanup(): number {
    let cleaned = 0;
    
    for (const [id, job] of this.jobs) {
      if (job.status === 'complete' || job.status === 'failed') {
        this.jobs.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.queue.pause();
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.queue.start();
  }

  /**
   * Clear all pending jobs
   */
  clear(): void {
    this.queue.clear();
    
    for (const [id, job] of this.jobs) {
      if (job.status === 'queued') {
        job.reject(new Error('Queue cleared'));
        this.jobs.delete(id);
      }
    }
  }

  /**
   * Typed event emitter
   */
  on<K extends keyof ArtServiceEvents>(
    event: K,
    listener: ArtServiceEvents[K]
  ): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  emit<K extends keyof ArtServiceEvents>(
    event: K,
    ...args: Parameters<ArtServiceEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
