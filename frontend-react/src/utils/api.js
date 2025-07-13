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

// Chat API helpers
export async function getConversationHistory() {
  const res = await fetch(`${API_BASE}/chat/history`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // Should return an array of {from, message}
}
export async function getConversationList() {
  const res = await fetch(`${API_BASE}/chat/list`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // Should return an array of {from, message}
}


export async function sendMessage(message) {
  const res = await fetch(`${API_BASE}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // Should return the new message or status
}

export function openAgentStatusSocket(onStatus) {
  const ws = new WebSocket('wss://localhost:8000/api/chat/status'); // Change to your backend WS URL
  ws.onmessage = (event) => {
    if (onStatus) onStatus(JSON.parse(event.data));
  };
  return ws;
} 