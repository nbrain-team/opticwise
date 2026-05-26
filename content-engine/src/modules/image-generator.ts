import fs from 'fs';
import path from 'path';
import { createLogger } from '../util/logger.js';

const log = createLogger('image-generator');

const IDEOGRAM_API_URL = 'https://api.ideogram.ai/generate';

const NEGATIVE_PROMPT =
  'no people, no binary code, no glowing spheres, no handshakes, no globes with network lines, no holograms, no stock-photo aesthetic, no clipart, no watermarks';

interface ImageRequest {
  prompt: string;
  width: number;
  height: number;
  fileName: string;
}

interface GeneratedImage {
  filePath: string;
  fileName: string;
  ok: boolean;
  error?: string;
}

export async function generateImages(
  apiKey: string,
  requests: ImageRequest[],
  outputDir: string,
): Promise<GeneratedImage[]> {
  fs.mkdirSync(outputDir, { recursive: true });
  const results: GeneratedImage[] = [];

  for (const req of requests) {
    const result = await generateSingleImage(apiKey, req, outputDir);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  log.info('image_generation_complete', { total: requests.length, succeeded, failed });

  return results;
}

async function generateSingleImage(
  apiKey: string,
  req: ImageRequest,
  outputDir: string,
): Promise<GeneratedImage> {
  const filePath = path.join(outputDir, req.fileName);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(IDEOGRAM_API_URL, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_request: {
            prompt: `${req.prompt}. ${NEGATIVE_PROMPT}`,
            aspect_ratio: aspectRatioString(req.width, req.height),
            model: 'V_2',
            magic_prompt_option: 'AUTO',
            style_type: 'REALISTIC',
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ideogram API ${response.status}: ${body}`);
      }

      const data = (await response.json()) as {
        data: Array<{ url: string }>;
      };

      if (!data.data?.[0]?.url) {
        throw new Error('Ideogram returned no image URL');
      }

      const imageResp = await fetch(data.data[0].url);
      if (!imageResp.ok) {
        throw new Error(`Failed to download image: ${imageResp.status}`);
      }

      const buffer = Buffer.from(await imageResp.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      log.info('image_generated', {
        fileName: req.fileName,
        size: buffer.length,
        attempt,
      });

      return { filePath, fileName: req.fileName, ok: true };
    } catch (err) {
      log.error(
        'image_generation_failed',
        err instanceof Error ? err : new Error(String(err)),
        { fileName: req.fileName, attempt },
      );

      if (attempt === 1) {
        return {
          filePath,
          fileName: req.fileName,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  }

  return { filePath, fileName: req.fileName, ok: false, error: 'exhausted retries' };
}

function aspectRatioString(width: number, height: number): string {
  if (width === 1920 && height === 1080) return 'ASPECT_16_9';
  if (width === 1200 && height === 630) return 'ASPECT_19_10';
  return 'ASPECT_16_9';
}
