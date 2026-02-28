import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Scanner } from '../src/scanner/stream-reader';

describe('Scanner', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures', 'scanner_test_dir');

  beforeAll(async () => {
    // Ensuring the fixture directory structure exists
    await mkdir(fixturesDir, { recursive: true });
    await mkdir(path.join(fixturesDir, 'nested'), { recursive: true });
    await mkdir(path.join(fixturesDir, 'node_modules'), { recursive: true });

    await writeFile(path.join(fixturesDir, 'file1.ts'), 'content1');
    await writeFile(path.join(fixturesDir, 'nested', 'file2.js'), 'content2');
    await writeFile(path.join(fixturesDir, 'image.png'), 'binary content');
    await writeFile(path.join(fixturesDir, 'node_modules', 'index.js'), 'ignored content');
    await writeFile(path.join(fixturesDir, '.gitignore'), 'node_modules\n.kountcache.json\n*.png');
  });

  afterAll(async () => {
    // Clean up to keep tests stateless
    await rm(fixturesDir, { recursive: true, force: true });
  });

  it('should discover files respecting gitignore and default ignores', async () => {
    const scanner = new Scanner(fixturesDir, true);
    const files = await scanner.discover(fixturesDir);

    // It should find file1.ts and nested/file2.js
    // It should ignore image.png (both because of binary ext and gitignore)
    // It should ignore node_modules/index.js (default ignore and gitignore)
    
    const filePaths = files.map(f => path.relative(fixturesDir, f.filePath));
    expect(filePaths).toContain('file1.ts');
    expect(filePaths).toContain(path.join('nested', 'file2.js'));
    expect(filePaths).toContain('.gitignore');
    expect(files.length).toBe(3);
  });

  it('should stream files in chunks and signal end', async () => {
    const filePath = path.join(fixturesDir, 'file1.ts');
    const scanner = new Scanner(fixturesDir, true);

    let chunks: Buffer[] = [];
    let endSignaled = false;

    await scanner.streamFile(filePath, (chunk, isLast) => {
      chunks.push(chunk);
      if (isLast) {
        endSignaled = true;
      }
    });

    const fullContent = Buffer.concat(chunks).toString();
    expect(fullContent).toBe('content1');
    expect(endSignaled).toBe(true);
  });
});
