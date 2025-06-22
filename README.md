# Subscription-Manager

### Subscriptions Schema (MongoDB)

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['Basic', 'Standard', 'Premium'], required: true },
  status: { type: String, enum: ['Active', 'Cancelled', 'Paused', 'Expired'], default: 'Active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  trialPeriod: { type: Boolean, default: false },
  paymentDetails: {
    gateway: { type: String, enum: ['Stripe', 'Razorpay'], required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['Success', 'Failed', 'Pending'], required: true }
  },
  renewalNotifications: [
    {
      date: { type: Date, required: true },
      method: { type: String, enum: ['Email', 'SMS', 'Webhook'], required: true }
    }
  ]
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;

Webhook handling:

app.post('/webhook', async (req, res) => {
    const event = req.body;
    
    if (event.type === 'invoice.payment_failed') {
        const userId = event.data.object.customer;
        await notifyUser(userId, 'Payment failed. Please update your payment details.');
    }

    res.sendStatus(200);
});

1. Update Subscription Schema

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['Basic', 'Standard', 'Premium'], required: true },
  status: { type: String, enum: ['Active', 'Paused', 'Cancelled', 'Expired'], default: 'Active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  pausedAt: { type: Date, default: null }, // Store pause timestamp
  resumedAt: { type: Date, default: null }, // Store resume timestamp
  paymentDetails: {
    gateway: { type: String, enum: ['Stripe', 'Razorpay'], required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Success', 'Failed', 'Pending'], required: true }
  }
}, { timestamps: true });

2. Pause Subscription API

app.put('/subscription/pause/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId });
        if (!subscription || subscription.status !== 'Active') {
            return res.status(400).json({ message: 'Subscription cannot be paused' });
        }

        subscription.status = 'Paused';
        subscription.pausedAt = new Date();
        await subscription.save();

        res.json({ message: 'Subscription paused successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error pausing subscription', error });
    }
});

3. Resume Subscription API

app.put('/subscription/resume/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId });
        if (!subscription || subscription.status !== 'Paused') {
            return res.status(400).json({ message: 'Subscription cannot be resumed' });
        }

        subscription.status = 'Active';
        subscription.resumedAt = new Date();
        await subscription.save();

        res.json({ message: 'Subscription resumed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resuming subscription', error });
    }
});

async function resumeSubscription(subscriptionId) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: ''
    });
    console.log('Subscription resumed:', subscription.id);
}

resumeSubscription('sub_12345');

1. Stripe Implementation

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function pauseSubscription(subscriptionId) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: { behavior: 'keep_as_draft' } // Keeps invoice drafts instead of canceling
    });
    console.log('Subscription paused:', subscription.id);
}

pauseSubscription('sub_12345'); // Example subscription ID

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

2. Configure Email Service

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // App password
    }
});

3. Send Email Notifications

async function sendEmail(userEmail, subject, message) {
    const mailOptions = {
        from: '"Subscription Manager" <your-email@gmail.com>',
        to: userEmail,
        subject: subject,
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

app.put('/subscription/pause/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
        if (!subscription || subscription.status !== 'Active') {
            return res.status(400).json({ message: 'Subscription cannot be paused' });
        }

        subscription.status = 'Paused';
        subscription.pausedAt = new Date();
        await subscription.save();

        await sendEmail(subscription.userId.email, 'Subscription Paused', 
            `Your subscription has been paused. Resume anytime in your account.`);

        res.json({ message: 'Subscription paused successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error pausing subscription', error });
    }
});

2. Create Email Templates

<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Subscription Paused</h2>
        </div>
        <div class="content">
            <p>Hi {{name}},</p>
            <p>Your subscription for <strong>{{plan}}</strong> has been paused.</p>
            <p>You can resume anytime from your account dashboard.</p>
            <p>Thank you for using our service!</p>
        </div>
    </div>
</body>
</html>

3. Load and Compile Templates

const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendTemplateEmail(userEmail, templateName, subject, data) {
    const templatePath = `./templates/${templateName}.hbs`;
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);
    const htmlContent = compiledTemplate(data);

    const mailOptions = {
        from: '"Subscription Manager" <your-email@gmail.com>',
        to: userEmail,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

app.put('/subscription/pause/:userId', async (req, res) => {
    const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
    if (!subscription || subscription.status !== 'Active') return res.status(400).json({ message: 'Subscription cannot be paused' });

    subscription.status = 'Paused';
    subscription.pausedAt = new Date();
    await subscription.save();

    await sendTemplateEmail(subscription.userId.email, 'pause_subscription', 'Subscription Paused', {
        name: subscription.userId.name,
        plan: subscription.plan
    });

    res.json({ message: 'Subscription paused successfully' });
});

4. Trigger Emails for Pause/Resume

app.put('/subscription/resume/:userId', async (req, res) => {
    const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
    if (!subscription || subscription.status !== 'Paused') return res.status(400).json({ message: 'Subscription cannot be resumed' });

    subscription.status = 'Active';
    subscription.resumedAt = new Date();
    await subscription.save();

app.put('/subscription/pause/:userId', async (req, res) => {
    const subscription = await Subscription.findOne({ userId: req.params.userId }).populate('userId');
    if (!subscription || subscription.status !== 'Active') return res.status(400).json({ message: 'Subscription cannot be paused' });

    subscription.status = 'Paused';
    subscription.pausedAt = new Date();
    await subscription.save();

   res.json({ message: 'Subscription paused successfully' });

});
    await sendTemplateEmail(subscription.userId.email, 'resume_subscription', 'Subscription Resumed', {
        name: subscription.userId.name,
        plan: subscription.plan
    });

    res.json({ message: 'Subscription resumed successfully' });
});

✅1. Automated Retry System

// In subscription schema
retryCount: { type: Number, default: 0 },
nextRetryAt: { type: Date },

// Retry logic
if (subscription.retryCount < 3) {
  subscription.retryCount += 1;
  subscription.nextRetryAt = Date.now() + 24 * 60 * 60 * 1000; // retry after 24 hrs
}

⏳2. Grace Period System

graceEndsAt: { type: Date },

// Set during webhook failure
subscription.graceEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

✅ Schema Enhancements

retryCount: { type: Number, default: 0 },
nextRetryAt: { type: Date },
graceEndsAt: { type: Date },
inGracePeriod: { type: Boolean, default: false },

🔁 Webhook Handler: Retry & Grace Logic

app.post('/webhook', async (req, res) => {
  const event = req.body;

  if (event.type === 'invoice.payment_failed') {
    const userId = event.data.object.customer;
    const subscription = await Subscription.findOne({ userId });

    if (subscription) {
      // Start grace period if first failure
      if (!subscription.inGracePeriod) {
        subscription.inGracePeriod = true;
        subscription.graceEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
        subscription.retryCount = 1;
        subscription.nextRetryAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      } else if (subscription.retryCount < 3) {
        subscription.retryCount += 1;
        subscription.nextRetryAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else {
        subscription.status = 'Expired';
        subscription.inGracePeriod = false;
      }

      await subscription.save();
      await notifyUser(userId, 'Payment failed. We’ll retry automatically. Update your payment info to avoid service interruption.');
    }
  }

  res.sendStatus(200);
});

✅ For Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function attemptRetryPayment(subscription) {
  try {
    const invoice = await stripe.invoices.create({
      customer: subscription.userId, // assuming this is Stripe's customer ID
      auto_advance: true,
    });

    await stripe.invoices.finalizeInvoice(invoice.id);
    return true;
  } catch (err) {
    console.error('Stripe retry failed:', err.message);
    return false;
  }
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

💻 Recovery Panel UI (React Component)

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SubscriptionRecoveryPanel() {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await axios.get('/admin/subscriptions/recovery');
    setSubs(res.data);
  }

  async function retryNow(id) {
    await axios.post(`/admin/subscriptions/${id}/retry`);
    fetchData();
  }

  async function extendGrace(id) {
    await axios.post(`/admin/subscriptions/${id}/extend-grace`);
    fetchData();
  }

  return (
    <div className="p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-semibold mb-4">🛠 Subscriptions in Recovery</h2>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th>User</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Retry</th>
            <th>Grace Ends</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((sub) => (
            <tr key={sub._id} className="border-b hover:bg-gray-50">
              <td>{sub.userId?.name}</td>
              <td>{sub.plan}</td>
              <td>{sub.status}</td>
              <td>{sub.retryCount}/3</td>
              <td>{new Date(sub.graceEndsAt).toLocaleDateString()}</td>
              <td className="space-x-2">
                <button
                  onClick={() => retryNow(sub._id)}
                  className="px-2 py-1 bg-blue-500 text-white rounded"
                >
                  Retry
                </button>
                <button
                  onClick={() => extendGrace(sub._id)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  +2d Grace
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
