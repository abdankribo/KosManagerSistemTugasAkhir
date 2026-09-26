import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) router.replace('/dashboard');
    else setError((await response.json()).error || 'Login gagal');
  }

  return (
    <main className="auth">
      <form onSubmit={submit}>
        <h1>KOS MANAGER</h1>
        <p>Masuk ke dashboard</p>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <div className="error">{error}</div>}
        <button>Masuk</button>
      </form>
    </main>
  );
}
