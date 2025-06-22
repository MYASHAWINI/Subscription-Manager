2. Razorpay Implementation

const axios = require('axios');

async function pauseSubscription(subscriptionId) {
    const response = await axios.post(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/pause`, {
        pause_at_cycle_end: true // Subscription pauses at the cycle's end
    }, {
        headers: { Authorization: `Basic ${process.env.RAZORPAY_AUTH}` }
    });
    console.log('Subscription paused:', response.data);
}

✅ For Razorpay

const Razorpay = require('razorpay');
const razorpay = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.KEY_SECRET });

async function attemptRetryPayment(subscription) {
  try {
    const order = await razorpay.orders.create({
      amount: subscription.paymentDetails.amount * 100, // in paise
      currency: subscription.paymentDetails.currency,
      receipt: `retry_${Date.now()}`,
    });

    // Store order ID for future reference or manual payment link generation
    subscription.paymentDetails.retryOrderId = order.id;
    await subscription.save();

    // Optionally email/SMS user a link to pay manually
    await notifyUser(subscription.userId, `Retry your payment here: https://yourdomain.com/pay/${order.id}`);

    return false; // Not auto-paid, user must complete it
  } catch (err) {
    console.error('Razorpay retry failed:', err.message);
    return false;
  }
}

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

🖥️ Frontend: Dashboard Components

// Example column
<td>{formatDate(subscription.graceEndsAt)}</td>
<td>{subscription.retryCount}/3</td>
<td>{subscription.status}</td>

🔘2. Action Buttons

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

## 💸 **Stripe-Specific Flow**

### 🧱 **1. Create Customer**

When a user registers, create a **Stripe customer**:

const customer = await stripe.customers.create({
  email: user.email,
});
user.stripeCustomerId = customer.id;

---

### 📦 **2. Create Checkout Session**

Send product/price IDs from frontend to create a session:

const session = await stripe.checkout.sessions.create({
  customer: user.stripeCustomerId,
  line_items: [{
    price: 'price_ABC123', // Your Stripe Price ID
    quantity: 1
  }],
  mode: 'subscription',
  success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${DOMAIN}/cancel`,
});
res.json({ url: session.url });

---

### 🧾 **3. Handle Webhooks**

Setup a Stripe webhook listener for these events:

* `checkout.session.completed`
* `invoice.payment_succeeded`
* `invoice.payment_failed`
* `customer.subscription.updated`
* `customer.subscription.deleted`

app.post('/api/subscribe/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // Save subscription info to DB
        break;
      case 'invoice.payment_failed':
        // Notify user or mark subscription as pending
        break;
      // ...handle other cases
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

---

### 🔄 **4. Upgrade / Downgrade Plan**

await stripe.subscriptions.update(subscriptionId, {
  items: [{
    id: subscriptionItemId,
    price: 'price_NEW',
  }],
  proration_behavior: 'create_prorations',
});

---

### ❌ **5. Cancel Subscription**

await stripe.subscriptions.del(subscriptionId); // or use .update with cancel_at_period_end

---

### ▶️ **6. Resume Subscription**

If canceled with `cancel_at_period_end`, resume it before it ends:

await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: false,
});

---
