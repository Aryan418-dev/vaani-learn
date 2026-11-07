import { Link } from 'react-router-dom';
import { lessons } from '../data/lessons';
import { loadAttempts } from '../lib/progress';

export default function Home() {
  const attempts = loadAttempts();
  const avg =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length)
      : 0;

  return (
    <div className="stack">
      <div className="card">
        <p className="muted" style={{ margin: 0, fontWeight: 600, color: 'var(--highlight)' }}>
          Gnani-powered voice coach
        </p>
        <h1>Vaani Learn</h1>
        <p className="muted">
          Speak the prompt. Get a transcript and score. Hear a model answer. Built on Gnani Prisma STT and
          Timbre TTS.
        </p>
        <div className="row" style={{ marginTop: '1rem' }}>
          <Link className="btn" to="/lessons">Browse lessons</Link>
          <Link className="btn outline" to="/progress">View progress</Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Attempts</p>
          <p className="score" style={{ margin: '0.25rem 0 0' }}>{attempts.length}</p>
        </div>
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Avg score</p>
          <p className="score" style={{ margin: '0.25rem 0 0' }}>{avg}</p>
        </div>
      </div>

      <section className="stack">
        <h2>Start practicing</h2>
        <div className="grid grid-2">
          {lessons.slice(0, 4).map((l) => (
            <Link key={l.id} to={`/lessons/${l.id}`} className="card">
              <strong>{l.name}</strong>
              <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
                {l.level} · {l.language}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
