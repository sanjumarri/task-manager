import { getStoredUser } from "../services/api";

export default function DashboardPage() {
  const user = getStoredUser();

  return (
    <main>
      <h1>Dashboard</h1>
      {user && <p>Welcome, {user.name}.</p>}
    </main>
  );
}
