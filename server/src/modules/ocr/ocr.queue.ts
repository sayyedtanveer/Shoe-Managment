import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { Worker as ThreadWorker } from 'worker_threads';
import fs from 'fs/promises';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const OCR_QUEUE_NAME = 'ocr-processing';

export interface OcrJobPayload {
    filePath: string;
}

export interface OcrJobResult {
    lines: string[];
    rawText: string;
}

export const ocrQueue = new Queue<OcrJobPayload, OcrJobResult>(OCR_QUEUE_NAME, { connection });

let ocrWorker: Worker<OcrJobPayload, OcrJobResult> | null = null;

function runTesseractThread(filePath: string): Promise<OcrJobResult> {
    return new Promise((resolve, reject) => {
        const worker = new ThreadWorker(
            `
            const { parentPort, workerData } = require('worker_threads');
            const { createWorker } = require('tesseract.js');

            (async () => {
                try {
                    const ocrWorker = await createWorker('eng');
                    const { data } = await ocrWorker.recognize(workerData.filePath);
                    await ocrWorker.terminate();
                    parentPort.postMessage({ rawText: data.text || '' });
                } catch (error) {
                    parentPort.postMessage({ error: error instanceof Error ? error.message : 'OCR worker failed' });
                }
            })();
        `,
            { eval: true, workerData: { filePath } }
        );

        worker.on('message', (message: { rawText?: string; error?: string }) => {
            if (message.error) {
                reject(new Error(message.error));
                return;
            }
            const rawText = message.rawText ?? '';
            const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
            resolve({ rawText, lines });
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`OCR worker exited with code ${code}`));
            }
        });
    });
}

export function startOcrWorker() {
    if (ocrWorker) return ocrWorker;

    ocrWorker = new Worker<OcrJobPayload, OcrJobResult>(
        OCR_QUEUE_NAME,
        async (job: Job<OcrJobPayload, OcrJobResult>) => {
            await job.updateProgress(15);
            const result = await runTesseractThread(job.data.filePath);
            await job.updateProgress(100);
            await fs.unlink(job.data.filePath).catch(() => undefined);
            return result;
        },
        { connection }
    );

    return ocrWorker;
}
