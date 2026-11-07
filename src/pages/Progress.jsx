import { Link } from 'react-router-dom';
import { loadAttempts } from '../lib/progress';

export default function Progress() {
  const attempts = loadAttempts();

  return (
    <div className="stack">
      <div>
        <h1>Progress</h1>
        <p className="muted">Recent speaking attempts (saved in this browser).</p>
      </div>
      {attempts.length === 0 ? (
        <div className="card">
          <p className="muted">No attempts yet.</p>
          <Link className="btn" to="/lessons">Browse lessons</Link>
        </div>
      ) : (
        attempts.map((a) => (
          <div key={a.id} className="card row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{a.drillName}</strong>
              <p className="muted" style={{ margin: '0.35rem 0', fontSize: '0.9rem' }}>{a.transcript}</p>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                {a.status} · {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="score">{a.score}</div>
              <Link to={`/practice/${a.drillId}`} style={{ fontSize: '0.85rem', color: 'var(--highlight)' }}>
                Practice again
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
