import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Practice from './pages/Practice';
import Progress from './pages/Progress';

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">Vaani Learn</span>
          <span className="brand-sub">Voice-first practice</span>
        </div>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/lessons">Lessons</NavLink>
          <NavLink to="/progress">Progress</NavLink>
        </nav>
        <p className="sidebar-foot">Gnani Prisma · Timbre</p>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/:id" element={<LessonDetail />} />
          <Route path="/practice/:id" element={<Practice />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>
    </div>
  );
}
