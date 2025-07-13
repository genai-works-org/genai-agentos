const API_BASE = 'http://localhost:8000/api'; // Change to your backend URL

export async function signup({ email, password, firstName }) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function signin({ email, password }) {
  const res = await fetch(`${API_BASE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
} 