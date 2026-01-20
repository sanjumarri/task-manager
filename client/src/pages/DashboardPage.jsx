import { getStoredUser } from "../services/api";

export default function DashboardPage() {
  const user = getStoredUser();

  return (
    <main className="page">
      <div className="card">
        <h1>Dashboard</h1>
        {user && <p className="empty">Welcome, {user.name}.</p>}
      </div>
    </main>
  );
}
