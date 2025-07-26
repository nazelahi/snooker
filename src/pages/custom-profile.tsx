import { useCustomAuth } from '@/hooks/useCustomAuth';

export default function CustomProfilePage() {
  const { user, profile, loading, logout } = useCustomAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You are not logged in.</div>;

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>My Profile</h2>
      {profile ? (
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      ) : (
        <p>Profile not found.</p>
      )}
      <button onClick={logout} style={{ marginTop: 20 }}>Logout</button>
    </div>
  );
} 