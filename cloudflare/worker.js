const LESSONS = [
  {
    id: "l1",
    title: "Greetings",
    level: "Beginner",
    lang: "en",
    teach: [
      { type: "explain", text: "In English we say Hello or Hi when we meet someone. For a polite introduction we use: Hello, my name is..." },
      { type: "phrase", text: "Hello, my name is Priya.", meaning: "Simple self-introduction" },
      { type: "phrase", text: "Nice to meet you.", meaning: "Polite response after introduction" }
    ],
    dialogue: [
      { role: "tutor", text: "Hello! My name is Vaani. What is your name?" },
      { role: "user", expected: "my name is", hint: "Say: Hello, my name is [your name]." },
      { role: "tutor", text: "Nice to meet you! How are you today?" },
      { role: "user", expected: "I am fine", hint: "Say: I am fine, thank you." }
    ]
  },
  {
    id: "l2",
    title: "Ordering Food",
    level: "Beginner",
    lang: "en",
    teach: [
      { type: "explain", text: "At a cafe we use polite requests. Start with I would like or Can I have." },
      { type: "phrase", text: "I would like a coffee, please.", meaning: "Ordering a drink" },
      { type: "phrase", text: "The bill, please.", meaning: "Asking to pay" }
    ],
    dialogue: [
      { role: "tutor", text: "Welcome! What would you like to order?" },
      { role: "user", expected: "I would like", hint: "Say: I would like a coffee, please." },
      { role: "tutor", text: "Sure. Anything else?" },
      { role: "user", expected: "No", hint: "Say: No, that is all. Thank you." }
    ]
  },
  {
    id: "l3",
    title: "Hindi Greetings",
    level: "Beginner",
    lang: "hi",
    teach: [
      { type: "explain", text: "In Hindi we say Namaste to greet. To introduce: Mera naam ... hai." },
      { type: "phrase", text: "Namaste, mera naam Aarav hai.", meaning: "Hello, my name is Aarav." },
      { type: "phrase", text: "Main theek hoon.", meaning: "I am fine." }
    ],
    dialogue: [
      { role: "tutor", text: "Namaste! Mera naam Vaani hai. Aapka naam kya hai?" },
      { role: "user", expected: "mera naam", hint: "Kahiye: Namaste, mera naam [aapka naam] hai." },
      { role: "tutor", text: "Bahut accha! Aap kaise hain?" },
      { role: "user", expected: "theek", hint: "Kahiye: Main theek hoon." }
    ]
  }
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

async function handleStt(request, env) {
  const apiKey = (env.GNANI_API_KEY || "").trim();
  if (!apiKey) return json({ success: false, message: "GNANI_API_KEY is not set" }, 500);
  const body = await request.json();
  const audioBase64 = body && body.audioBase64;
  if (!audioBase64) return json({ success: false, message: "audioBase64 required" }, 400);
  const mimeType = (body && body.mimeType) || "audio/wav";
  const languageCode = (body && body.languageCode) || "indic-auto";

  const binary = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
  const form = new FormData();
  form.append("audio_file", new Blob([binary], { type: mimeType }), "rec.wav");
  form.append("model", "prisma-v3.0");
  form.append("language_code", languageCode);

  const res = await fetch("https://api.vachana.ai/stt/v3", {
    method: "POST",
    headers: { "X-API-Key-ID": apiKey },
    body: form
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) return json({ success: false, message: data.message || "STT failed" }, 502);
  const transcript = data.transcript || data.text || (data.result && data.result.transcript) || "";
  return json({ success: true, transcript });
}

async function handleTts(request, env) {
  const apiKey = (env.GNANI_API_KEY || "").trim();
  if (!apiKey) return json({ success: false, message: "GNANI_API_KEY is not set" }, 500);
  const body = await request.json();
  const text = ((body && body.text) || "").trim();
  if (!text) return json({ success: false, message: "text required" }, 400);
  const language = (body && body.language) || "en-IN";
  const voice = (body && body.voice) || (String(language).startsWith("hi") ? "Nalini" : "Yashvi");

  const payload = {
    text,
    voice,
    model: "timbre-v2.5",
    language,
    speed: 1.0,
    audio_config: { sample_rate: 24000, num_channels: 1, sample_width: 2, encoding: "linear_pcm", container: "wav" }
  };
  const res = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key-ID": apiKey },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text();
    return json({ success: false, message: "TTS failed", details: err }, 502);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json();
    const b64 = data.audio || data.audio_base64 || data.data;
    if (typeof b64 === "string") return json({ success: true, audioBase64: b64, contentType: "audio/wav" });
    return json({ success: false, message: "Unexpected TTS response" }, 502);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) binary += String.fromCharCode.apply(null, buf.subarray(i, i + chunk));
  return json({ success: true, audioBase64: btoa(binary), contentType: "audio/wav" });
}

function htmlPage() {
  const data = JSON.stringify(LESSONS);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Vaani Learn</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#f8f6f1;--card:#ffffff;--text:#1a1a1a;--muted:#6b7280;--primary:#3b82f6;--accent:#10b981;--border:#e5e7eb;--danger:#ef4444;--xp:#f59e0b}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased}
.app{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--bg)}
.topbar{background:var(--card);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.brand{font-weight:700;font-size:1.15rem;color:var(--primary)}
.stats{display:flex;gap:12px;font-size:0.85rem;font-weight:600}
.stat.xp{color:var(--xp)}.stat.streak{color:var(--danger)}
.main{flex:1;padding:16px;overflow-y:auto}
.banner{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border-radius:16px;padding:20px;margin-bottom:20px}
.banner h1{font-size:1.25rem;margin-bottom:6px}.banner p{opacity:0.9;font-size:0.9rem}
.path{display:flex;flex-direction:column;gap:12px;padding-bottom:40px}
.node{width:100%;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:14px;transition:transform .1s}
.node:active{transform:scale(0.98)}
.node.done{border-color:var(--accent);background:#f0fdf4}
.node-icon{width:48px;height:48px;border-radius:50%;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
.node.done .node-icon{background:#d1fae5}
.node-title{font-weight:600;font-size:1rem}
.node-meta{font-size:0.8rem;color:var(--muted);margin-top:2px}
.badge{font-size:0.7rem;padding:2px 8px;border-radius:999px;background:#eff6ff;color:var(--primary);font-weight:600}
.view{display:none}.view.active{display:block}
.back{display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-weight:500;font-size:0.9rem;margin-bottom:16px;cursor:pointer}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:12px}
.phrase{font-size:1.25rem;font-weight:600;margin:12px 0;color:var(--text)}
.meaning{font-size:0.85rem;color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:12px;padding:12px 20px;font-weight:600;font-size:0.95rem;font-family:inherit;cursor:pointer}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-primary{background:var(--primary);color:#fff}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--text)}
.btn-lg{width:100%;padding:16px;font-size:1.05rem;border-radius:14px}
.btn-row{display:flex;gap:10px;margin-top:16px}.btn-row .btn{flex:1}
.progress-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin:12px 0}
.progress-fill{height:100%;background:var(--primary);transition:width .3s}
.speak-area{text-align:center;padding:20px 0}
.tutor-bubble{background:#eff6ff;border-radius:18px 18px 18px 4px;padding:16px;margin-bottom:20px;text-align:left;font-size:1.05rem;line-height:1.45}
.mic-btn{width:80px;height:80px;border-radius:50%;background:var(--primary);color:#fff;border:none;font-size:2rem;cursor:pointer;box-shadow:0 4px 14px rgba(59,130,246,0.4);margin:16px auto;display:flex;align-items:center;justify-content:center}
.mic-btn.recording{background:var(--danger);animation:pulse 1s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.status{font-size:0.9rem;color:var(--muted);margin-top:8px;min-height:24px}
.feedback{padding:12px 16px;border-radius:12px;margin-top:12px;font-weight:500}
.feedback.good{background:#d1fae5;color:#065f46}
.feedback.ok{background:#fef3c7;color:#92400e}
.feedback.bad{background:#fee2e2;color:#991b1b}
.score-big{font-size:2.5rem;font-weight:700;color:var(--primary);margin:12px 0}
.hint{font-size:0.85rem;color:var(--muted);margin-top:8px;font-style:italic}
.step-label{font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);margin-bottom:8px}
</style>
</head>
<body>
<div class="app">
  <div class="topbar">
    <div class="brand">Vaani Learn</div>
    <div class="stats">
      <div class="stat xp">⚡ <span id="xpVal">0</span> XP</div>
      <div class="stat streak">🔥 <span id="streakVal">0</span></div>
    </div>
  </div>
  <div class="main">
    <div id="home" class="view active">
      <div class="banner">
        <h1>Learn first. Then speak.</h1>
        <p>Short teaching slides + real conversation practice with Vaani.</p>
      </div>
      <div class="path" id="path"></div>
    </div>
    <div id="teach" class="view">
      <div class="back" onclick="goHome()">← Back</div>
      <div class="step-label">Teach</div>
      <div class="progress-bar"><div class="progress-fill" id="teachProgress"></div></div>
      <div class="card" id="teachCard"></div>
      <div class="btn-row">
        <button class="btn btn-outline" onclick="playTeach()">🔊 Listen</button>
        <button class="btn btn-primary" id="nextTeachBtn" onclick="nextTeach()">Next →</button>
      </div>
    </div>
    <div id="speak" class="view">
      <div class="back" onclick="goHome()">← Back</div>
      <div class="step-label">Speak with Vaani</div>
      <div class="progress-bar"><div class="progress-fill" id="speakProgress"></div></div>
      <div class="speak-area" id="speakArea"></div>
    </div>
    <div id="result" class="view">
      <div class="card" style="text-align:center;padding:32px 20px">
        <div style="font-size:3rem;margin-bottom:8px">🎉</div>
        <h2>Lesson complete!</h2>
        <div class="score-big" id="finalScore">0</div>
        <p id="resultMsg">Great speaking practice.</p>
        <button class="btn btn-primary btn-lg" style="margin-top:20px" onclick="goHome()">Continue</button>
      </div>
    </div>
  </div>
</div>
<script>
const LESSONS = ${data};
let state = { lesson: null, teachIdx: 0, dialogueIdx: 0, scores: [], recording: false, _rec: null };
const store = {
  get() { try { return JSON.parse(localStorage.getItem("vaani") || "{}"); } catch { return {}; } },
  set(d) { localStorage.setItem("vaani", JSON.stringify(d)); },
  xp() { return this.get().xp || 0; },
  streak() { return this.get().streak || 0; },
  done() { return this.get().done || []; },
  addXp(n) { const d = this.get(); d.xp = (d.xp || 0) + n; this.set(d); updateStats(); },
  markDone(id) {
    const d = this.get(); d.done = d.done || [];
    if (!d.done.includes(id)) d.done.push(id);
    const today = new Date().toDateString();
    if (d.lastDay !== today) {
      d.streak = (d.lastDay && new Date(d.lastDay).getTime() > Date.now() - 86400000 * 2) ? (d.streak || 0) + 1 : 1;
      d.lastDay = today;
    }
    this.set(d); updateStats();
  }
};
function updateStats() {
  document.getElementById("xpVal").textContent = store.xp();
  document.getElementById("streakVal").textContent = store.streak();
}
function show(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function goHome() { show("home"); renderPath(); stopRec(); }
function renderPath() {
  const done = store.done();
  document.getElementById("path").innerHTML = LESSONS.map((l, i) => {
    const isDone = done.includes(l.id);
    return '<div class="node' + (isDone ? ' done' : '') + '" onclick="startLesson(\'' + l.id + '\')">' +
      '<div class="node-icon">' + (isDone ? '✓' : (i + 1)) + '</div>' +
      '<div><div class="node-title">' + l.title + '</div>' +
      '<div class="node-meta"><span class="badge">' + l.level + '</span> · ' + (l.lang === 'hi' ? 'Hindi' : 'English') + '</div></div></div>';
  }).join('');
}
function startLesson(id) {
  state.lesson = LESSONS.find(l => l.id === id);
  state.teachIdx = 0; state.dialogueIdx = 0; state.scores = [];
  show("teach"); renderTeach();
}
function renderTeach() {
  const l = state.lesson; const t = l.teach[state.teachIdx];
  document.getElementById("teachProgress").style.width = (state.teachIdx / l.teach.length * 100) + "%";
  const card = document.getElementById("teachCard");
  if (t.type === "explain") {
    card.innerHTML = '<div class="step-label">Concept</div><p style="font-size:1.05rem;line-height:1.55">' + t.text + '</p>';
  } else {
    card.innerHTML = '<div class="step-label">Phrase</div><div class="phrase">"' + t.text + '"</div><div class="meaning">' + t.meaning + '</div>';
  }
  document.getElementById("nextTeachBtn").textContent = state.teachIdx >= l.teach.length - 1 ? "Start Speaking →" : "Next →";
}
function playTeach() {
  const t = state.lesson.teach[state.teachIdx];
  playTTS(t.text, state.lesson.lang === "hi" ? "hi-IN" : "en-IN");
}
function nextTeach() {
  if (state.teachIdx < state.lesson.teach.length - 1) { state.teachIdx++; renderTeach(); }
  else startSpeak();
}
function startSpeak() { show("speak"); state.dialogueIdx = 0; renderSpeak(); }
function renderSpeak() {
  const l = state.lesson; const d = l.dialogue;
  document.getElementById("speakProgress").style.width = (state.dialogueIdx / d.length * 100) + "%";
  const area = document.getElementById("speakArea");
  if (state.dialogueIdx >= d.length) { finishLesson(); return; }
  const turn = d[state.dialogueIdx];
  if (turn.role === "tutor") {
    area.innerHTML = '<div class="tutor-bubble">' + turn.text + '</div>' +
      '<div class="status" id="status">Vaani is speaking...</div>' +
      '<button class="btn btn-outline" onclick="playTutor()">🔊 Replay</button>' +
      '<button class="btn btn-primary btn-lg" style="margin-top:12px" onclick="advanceAfterTutor()">I heard it →</button>';
    playTutor();
  } else {
    area.innerHTML = '<div class="tutor-bubble" id="lastTutor"></div>' +
      '<div class="hint">Your turn: ' + turn.hint + '</div>' +
      '<button class="mic-btn" id="micBtn" onclick="toggleRec()">🎙️</button>' +
      '<div class="status" id="status">Tap to speak</div><div id="feedback"></div>';
    const prev = d[state.dialogueIdx - 1];
    if (prev) document.getElementById("lastTutor").textContent = prev.text;
  }
}
function playTutor() {
  const turn = state.lesson.dialogue[state.dialogueIdx];
  if (turn && turn.role === "tutor") playTTS(turn.text, state.lesson.lang === "hi" ? "hi-IN" : "en-IN");
}
function advanceAfterTutor() { state.dialogueIdx++; renderSpeak(); }
async function playTTS(text, language) {
  try {
    const st = document.getElementById("status");
    if (st) st.textContent = "Speaking...";
    const res = await fetch("/api/tts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "TTS error");
    const audio = new Audio("data:audio/wav;base64," + data.audioBase64);
    await audio.play();
    if (st) st.textContent = "Your turn";
  } catch (e) {
    const st = document.getElementById("status");
    if (st) st.textContent = "Could not play audio";
  }
}
function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);
  return buffer;
}
async function toggleRec() {
  if (state.recording) { stopRec(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const samples = [];
    processor.onaudioprocess = e => { samples.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    source.connect(processor);
    processor.connect(ctx.destination);
    state.recording = true;
    state._rec = { stream, ctx, processor, samples };
    document.getElementById("micBtn").classList.add("recording");
    document.getElementById("status").textContent = "Recording... tap again to stop";
  } catch (e) {
    document.getElementById("status").textContent = "Mic permission denied";
  }
}
function stopRec() {
  if (!state.recording || !state._rec) return;
  state.recording = false;
  const { stream, ctx, processor, samples } = state._rec;
  try { processor.disconnect(); } catch (e) {}
  stream.getTracks().forEach(t => t.stop());
  try { ctx.close(); } catch (e) {}
  state._rec = null;
  const mic = document.getElementById("micBtn");
  if (mic) mic.classList.remove("recording");
  document.getElementById("status").textContent = "Processing...";
  let len = 0; samples.forEach(s => len += s.length);
  const merged = new Float32Array(len);
  let off = 0; samples.forEach(s => { merged.set(s, off); off += s.length; });
  const wav = encodeWav(merged, 16000);
  const b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(wav)));
  scoreUtterance(b64);
}
async function scoreUtterance(audioBase64) {
  const turn = state.lesson.dialogue[state.dialogueIdx];
  const lang = state.lesson.lang === "hi" ? "hi-IN" : "en-IN";
  try {
    const res = await fetch("/api/stt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType: "audio/wav", languageCode: lang === "hi-IN" ? "hi-IN" : "indic-auto" })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "STT failed");
    const transcript = (data.transcript || "").toLowerCase().trim();
    const expected = (turn.expected || "").toLowerCase();
    let score = 0;
    if (transcript.includes(expected) || expected.split(" ").some(w => w.length > 2 && transcript.includes(w))) {
      score = 85 + Math.floor(Math.random() * 15);
    } else if (transcript.length > 3) {
      score = 40 + Math.floor(Math.random() * 30);
    } else {
      score = 20;
    }
    state.scores.push(score);
    const fb = document.getElementById("feedback");
    const cls = score >= 70 ? "good" : score >= 45 ? "ok" : "bad";
    fb.className = "feedback " + cls;
    fb.innerHTML = 'You said: "' + data.transcript + '" · Score: ' + score;
    document.getElementById("status").textContent = score >= 70 ? "Great!" : "Try to match the phrase more closely";
    setTimeout(() => { state.dialogueIdx++; renderSpeak(); }, 1800);
  } catch (e) {
    document.getElementById("status").textContent = "Error: " + (e.message || "STT failed");
  }
}
function finishLesson() {
  const avg = state.scores.length ? Math.round(state.scores.reduce((a, b) => a + b, 0) / state.scores.length) : 70;
  const xp = 20 + Math.round(avg / 5);
  store.addXp(xp);
  store.markDone(state.lesson.id);
  document.getElementById("finalScore").textContent = "+" + xp + " XP";
  document.getElementById("resultMsg").textContent = "Average score: " + avg + " · Keep practising!";
  show("result");
}
updateStats();
renderPath();
</script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (url.pathname === "/api/stt" && request.method === "POST") return handleStt(request, env);
    if (url.pathname === "/api/tts" && request.method === "POST") return handleTts(request, env);
    return new Response(htmlPage(), {
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-cache" }
    });
  }
};
