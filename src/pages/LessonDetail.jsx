import { Link, useParams } from 'react-router-dom';
import { getLesson, getDrillsForLesson } from '../data/lessons';

export default function LessonDetail() {
  const { id } = useParams();
  const lesson = getLesson(id);
  const drills = getDrillsForLesson(id);

  if (!lesson) {
    return (
      <div>
        <Link className="back" to="/lessons">← Back to Lessons</Link>
        <p className="muted">Lesson not found.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <Link className="back" to="/lessons">← Back to Lessons</Link>
      <div className="card">
        <div className="row">
          <span className="badge">{lesson.level}</span>
          <span className="badge">{lesson.language}</span>
        </div>
        <h1 style={{ marginTop: '0.75rem' }}>{lesson.name}</h1>
        <p className="muted">{lesson.description}</p>
      </div>
      <h2>Speaking drills</h2>
      {drills.map((d, i) => (
        <div key={d.id} className="card row" style={{ justifyContent: 'space-between' }}>
          <div>
            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Drill {i + 1}</p>
            <strong>{d.name}</strong>
            <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>{d.prompt}</p>
          </div>
          <Link className="btn" to={`/practice/${d.id}`}>Speak</Link>
        </div>
      ))}
    </div>
  );
}
