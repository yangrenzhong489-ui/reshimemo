import { File } from 'expo-file-system';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export type OcrResult =
  | { success: true; text: string }
  | { success: false; reason: 'no-api-key' | 'no-text' | 'network-error' | 'api-error' };

/** レシート写真からGoogle Cloud Vision APIでテキストを読み取る。 */
export async function recognizeTextFromImage(photoUri: string): Promise<OcrResult> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return { success: false, reason: 'no-api-key' };
  }

  try {
    const file = new File(photoUri);
    const base64 = await file.base64();

    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, reason: 'api-error' };
    }

    const json = await response.json();
    const apiError = json?.responses?.[0]?.error;
    if (apiError) {
      return { success: false, reason: 'api-error' };
    }

    const text = String(json?.responses?.[0]?.fullTextAnnotation?.text ?? '').trim();
    if (!text) {
      return { success: false, reason: 'no-text' };
    }

    return { success: true, text };
  } catch (error) {
    console.warn('[ocr-service] OCR処理に失敗しました', error);
    return { success: false, reason: 'network-error' };
  }
}
