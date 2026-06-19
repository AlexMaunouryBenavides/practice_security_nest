import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/Login';
import UsersPage from './pages/Users';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </div>
  );
}
