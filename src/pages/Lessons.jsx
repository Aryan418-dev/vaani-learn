import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lessons } from '../data/lessons';

export default function Lessons() {
  const [q, setQ] = useState('');
  const filtered = lessons.filter((l) =>
    l.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="stack">
      <div>
        <h1>Lessons</h1>
        <p className="muted">Pick a lesson, then speak each drill aloud.</p>
      </div>
      <input
        className="search"
        placeholder="Search lessons…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="grid grid-2">
        {filtered.map((l) => (
          <Link key={l.id} to={`/lessons/${l.id}`} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{l.name}</strong>
              <span className="badge">{l.level}</span>
            </div>
            <p className="muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {l.description}
            </p>
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {l.language} · {l.topic} · {l.durationMin} min
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
