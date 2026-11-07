import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDrill } from '../data/lessons';
import { saveAttempt } from '../lib/progress';

function scoreTranscript(transcript, model) {
  const a = (transcript || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  const b = (model || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (!a.length || !b.length) return 40;
  const setB = new Set(b);
  const hits = a.filter((w) => setB.has(w)).length;
  return Math.min(100, Math.round(35 + (hits / Math.max(b.length, 1)) * 65));
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function Practice() {
  const { id } = useParams();
  const drill = getDrill(id);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('Ready — Gnani Prisma STT & Timbre TTS');
  const [error, setError] = useState('');

  if (!drill) {
    return (
      <div>
        <Link className="back" to="/lessons">← Back</Link>
        <p className="muted">Drill not found.</p>
      </div>
    );
  }

  async function speakModel() {
    setError('');
    setBusy(true);
    setStatus('Calling Gnani Timbre TTS…');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: drill.modelAnswer,
          language: drill.lessonId === 'les06' ? 'hi-IN' : 'en-IN',
          model: 'timbre-v2.5',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'TTS failed');
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      await audio.play();
      setStatus('Playing Gnani Timbre audio');
    } catch (e) {
      setError(e.message);
      setStatus('TTS failed');
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        await transcribe(blob);
      };
      rec.start();
      setRecording(true);
      setTranscript('');
      setScore(null);
      setFeedback('');
      setStatus('Recording… speak, then stop');
    } catch {
      setError('Microphone permission is required');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state !== 'inactive') recorderRef.current.stop();
    setRecording(false);
    setStatus('Sending audio to Gnani Prisma STT…');
  }

  async function transcribe(blob) {
    setBusy(true);
    try {
      const audioBase64 = await blobToBase64(blob);
      const res = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || 'audio/webm',
          languageCode: 'indic-auto',
          model: 'prisma-v3.0',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'STT failed');
      const text = (data.transcript || '').trim();
      if (!text) throw new Error('No speech detected');
      setTranscript(text);
      const s = scoreTranscript(text, drill.modelAnswer);
      setScore(s);
      setFeedback(
        s >= 85
          ? 'Strong match. Natural and clear.'
          : s >= 65
            ? 'Good effort. Compare with the model answer and try again.'
            : 'Keep practicing. Listen to the model answer, then speak slower.'
      );
      setStatus('Transcribed with Gnani Prisma STT');
    } catch (e) {
      setError(e.message);
      setStatus('STT failed');
    } finally {
      setBusy(false);
    }
  }

  function onSave() {
    if (score === null || !transcript) return;
    saveAttempt({
      drillId: drill.id,
      drillName: drill.name,
      transcript,
      score,
      feedback,
      status: score >= 70 ? 'Completed' : 'Needs practice',
    });
    setStatus('Attempt saved locally');
  }

  return (
    <div className="stack">
      <Link className="back" to={`/lessons/${drill.lessonId}`}>← Back to lesson</Link>

      <div className="card stack">
        <div>
          <p className="muted" style={{ margin: 0, color: 'var(--highlight)', fontWeight: 600, fontSize: '0.8rem' }}>
            SPEAK THIS
          </p>
          <h1>{drill.name}</h1>
          <p style={{ fontSize: '1.1rem' }}>{drill.prompt}</p>
          {drill.hint && <p className="muted">Hint: {drill.hint}</p>}
        </div>
        <div className="row">
          {!recording ? (
            <button className="btn" disabled={busy} onClick={startRecording}>
              {busy ? 'Working…' : 'Start speaking'}
            </button>
          ) : (
            <button className="btn danger" onClick={stopRecording}>Stop & transcribe</button>
          )}
          <button className="btn outline" disabled={busy || recording} onClick={speakModel}>
            Hear model answer
          </button>
        </div>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>{status}</p>
        {error && <p style={{ color: '#c44', margin: 0 }}>{error}</p>}
      </div>

      <div className="card stack">
        <h2>Your speech</h2>
        <p>{transcript || (recording ? 'Recording…' : 'Press Start speaking, then stop.')}</p>
        <button className="btn" disabled={score === null} onClick={onSave}>Save attempt</button>
        {score !== null && (
          <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div className="score">{score}</div>
            <p className="muted">{feedback}</p>
            <p><span className="muted">Model: </span>{drill.modelAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
