import fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import path from 'node:path';
import type { StageCallback } from '../plugins/types.js';
import { IgnoreParser } from './ignore-parser.js';

export interface ScannedFile {
  filePath: string;
  size: number;
}

export type FileChunkCallback = (chunk: Buffer, isLast: boolean) => void;

/**
 * Recursively walks directories and streams files chunk-by-chunk.
 * Respects .gitignore and built-in binary exclusions via IgnoreParser.
 */
export class Scanner {
  private parser: IgnoreParser;
  private discoveredCount = 0;

  constructor(rootDir: string, respectGitignore: boolean = true) {
    this.parser = new IgnoreParser(rootDir, respectGitignore);
  }

  /**
   * Discovers all files in the directory tree matching rules.
   */
  async discover(dirPath: string, onProgress?: StageCallback): Promise<ScannedFile[]> {
    this.discoveredCount = 0;
    await this.parser.init();
    return this.walk(path.resolve(dirPath), onProgress);
  }

  private async walk(currentDir: string, onProgress?: StageCallback): Promise<ScannedFile[]> {
    const filesList: ScannedFile[] = [];

    // Provide ignore rules for this specific directory level
    await this.parser.loadIgnoreForDir(currentDir);

    try {
      const entries = await fsp.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Check ignore rules immediately to avoid stat calls on ignored paths
        if (this.parser.isIgnored(fullPath, entry.isDirectory())) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.walk(fullPath, onProgress);
          filesList.push(...subFiles);
        } else if (entry.isFile()) {
           try {
             // We need the size, though we could get it via stats here or let the caller do it.
             // We'll calculate it so plugins can use it.
             const stats = await fsp.stat(fullPath);
             filesList.push({ filePath: fullPath, size: stats.size });
             this.discoveredCount++;
             if (onProgress && this.discoveredCount % 50 === 0) {
               onProgress('DISCOVERING', fullPath);
             }
           } catch (e) {
             // Handle gracefully: e.g. broken symlink or permission denied
             // Could hook a logger here later.
           }
        }
      }
    } catch (e) {
        // e.g. Permission denied on directory
    }

    return filesList;
  }

  /**
   * Streams a file in chunks without reading the whole file into memory.
   */
  streamFile(filePath: string, onChunk: FileChunkCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      // High water mark set to a reasonable chunk size (e.g. 64KB) to keep memory low
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

      stream.on('data', (chunk: Buffer | string) => {
        // Enforce Buffer
        const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        // We pass false for `isLast` because we don't know yet.
        // We will signal `isLast` on 'end' if needed, but typically passing the chunk is enough.
        // For line counting plugins relying on chunks, we might need a signal to flush remaining lines.
        onChunk(bufferChunk, false);
      });

      stream.on('error', (err) => {
        reject(err);
      });

      stream.on('end', () => {
        // Send a final empty chunk with isLast = true so plugins can flush state.
        onChunk(Buffer.alloc(0), true);
        resolve();
      });
    });
  }
}
