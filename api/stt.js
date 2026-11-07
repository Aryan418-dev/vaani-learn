export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'POST only' });
  }

  const apiKey = (process.env.GNANI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'GNANI_API_KEY is not set on Vercel. Add it in Project Settings → Environment Variables.',
    });
  }

  const { audioBase64, mimeType = 'audio/webm', languageCode = 'indic-auto', model = 'prisma-v3.0' } =
    req.body || {};

  if (!audioBase64) {
    return res.status(400).json({ success: false, message: 'audioBase64 is required' });
  }

  let binary;
  try {
    binary = Buffer.from(audioBase64, 'base64');
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid base64 audio' });
  }

  const ext = String(mimeType).includes('wav')
    ? 'wav'
    : String(mimeType).includes('ogg')
      ? 'ogg'
      : String(mimeType).includes('mp3') || String(mimeType).includes('mpeg')
        ? 'mp3'
        : String(mimeType).includes('m4a') || String(mimeType).includes('mp4')
          ? 'm4a'
          : 'webm';

  const form = new FormData();
  form.append('audio_file', new Blob([binary], { type: mimeType }), `recording.${ext}`);
  form.append('model', model);
  form.append('language_code', languageCode);

  try {
    const gnaniRes = await fetch('https://api.vachana.ai/stt/v3', {
      method: 'POST',
      headers: { 'X-API-Key-ID': apiKey },
      body: form,
    });

    const text = await gnaniRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!gnaniRes.ok) {
      return res.status(502).json({
        success: false,
        message: data.message || data.error || `Gnani STT failed (${gnaniRes.status})`,
        details: data,
      });
    }

    const transcript =
      data.transcript ||
      data.text ||
      data.result?.transcript ||
      data.data?.transcript ||
      '';

    return res.status(200).json({
      success: true,
      transcript,
      detected_language_code: data.detected_language_code || data.language_code || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'STT request failed',
    });
  }
}
