🔐 Admin Login Panel (React)

import { useState } from 'react';
import axios from 'axios';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await axios.post('/admin/login', { email, password: pass });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.token);
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-xl font-semibold mb-4">🔐 Admin Login</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input className="w-full mb-3 p-2 border rounded" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full mb-3 p-2 border rounded" type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
}

🖥️ Frontend: Dashboard Components

// Example column
<td>{formatDate(subscription.graceEndsAt)}</td>
<td>{subscription.retryCount}/3</td>
<td>{subscription.status}</td>

🔘. Action Buttons

<button onClick={() => handleRetry(subscription._id)}>Retry Now</button>
<button onClick={() => extendGrace(subscription._id, 2)}>Extend 2 Days</button>
<button onClick={() => retryNow(sub._id)}>🔁 Retry Now</button>
<button onClick={() => extendGrace(sub._id)}>⏳ +2 Days</button>

🔌 Backend: Build Admin Control APIs

// Fetch subscriptions in recovery mode
app.get('/admin/subscriptions/recovery', adminAuth, async (req, res) => {
  const subscriptions = await Subscription.find({
    $or: [
      { inGracePeriod: true },
      { retryCount: { $gt: 0 } }
    ]
  }).populate('userId', 'name email');

  res.json(subscriptions);
});

// Force a retry now
app.post('/admin/subscriptions/:id/retry', adminAuth, async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  const success = await attemptRetryPayment(sub);
  await sub.save();
  res.json({ success });
});

// Extend grace period
app.post('/admin/subscriptions/:id/extend-grace', adminAuth, async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  sub.graceEndsAt = new Date(sub.graceEndsAt.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 days
  await sub.save();
  res.json({ message: 'Grace period extended' });
});

🔧 Backend: Add an Admin Endpoint

// routes/admin.js
app.get('/admin/subscriptions/recovery', async (req, res) => {
  const subs = await Subscription.find({
    $or: [
      { inGracePeriod: true },
      { retryCount: { $gt: 0 } }
    ]
  }).populate('userId', 'name email');

  res.json(subs);
});

🛠️ Backend Auth Route:

// /admin/login
app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
