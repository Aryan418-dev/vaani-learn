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

  const { text, language = 'en-IN', voice, model = 'timbre-v2.5', speed = 1.0 } = req.body || {};
  const clean = (text || '').trim();
  if (!clean) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }

  const chosenVoice = voice || (String(language).startsWith('hi') ? 'Nalini' : 'Yashvi');

  const payload = {
    text: clean,
    voice: chosenVoice,
    model,
    language,
    speed,
    audio_config: {
      sample_rate: 24000,
      num_channels: 1,
      sample_width: 2,
      encoding: 'linear_pcm',
      container: 'wav',
    },
  };

  try {
    const gnaniRes = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key-ID': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!gnaniRes.ok) {
      const errText = await gnaniRes.text();
      let details;
      try {
        details = JSON.parse(errText);
      } catch {
        details = errText;
      }
      return res.status(502).json({
        success: false,
        message: `Gnani TTS failed (${gnaniRes.status})`,
        details,
      });
    }

    const contentType = gnaniRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await gnaniRes.json();
      const b64 = data.audio || data.audio_base64 || data.data;
      if (typeof b64 === 'string') {
        return res.status(200).json({ success: true, audioBase64: b64, contentType: 'audio/wav' });
      }
      return res.status(502).json({ success: false, message: 'Unexpected TTS JSON', details: data });
    }

    const buf = Buffer.from(await gnaniRes.arrayBuffer());
    return res.status(200).json({
      success: true,
      audioBase64: buf.toString('base64'),
      contentType: 'audio/wav',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'TTS request failed',
    });
  }
}
