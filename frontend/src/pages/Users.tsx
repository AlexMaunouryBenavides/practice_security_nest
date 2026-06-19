import { Navigate, useNavigate } from 'react-router-dom';
import { useLogout, useUsers, type User } from '../api/hooks';
import { ApiError } from '../api/client';

function roleLabel(role: User['role']): string {
  return Array.isArray(role) ? role.join(', ') : role;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useUsers();
  const logout = useLogout();

  // Session is deduced from the API: a 401 means "not authenticated".
  if (error instanceof ApiError && error.status === 401) {
    return <Navigate to="/login" replace />;
  }

  const onLogout = () => {
    logout.mutate(undefined, {
      // Redirect even if the call fails — the local session is over either way.
      onSettled: () => navigate('/login'),
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <button
          onClick={onLogout}
          disabled={logout.isPending}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-50"
        >
          {logout.isPending ? 'Déconnexion…' : 'Logout'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Chargement…</p>}

      {error && !(error instanceof ApiError && error.status === 401) && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Erreur lors du chargement des utilisateurs.
        </p>
      )}

      {data && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-slate-500">{user.id}</td>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{roleLabel(user.role)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
