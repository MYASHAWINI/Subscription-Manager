💰 Razorpay Payment Flow

🔁 1. Create Plan (one-time setup)

{
  "period": "monthly",
  "interval": 1,
  "item": {
    "name": "Basic Plan",
    "amount": 99900,
    "currency": "INR"
  }
}
👤 2. Create Customer

const customer = await razorpay.customers.create({
  name: "John Doe",
  email: "john@example.com",
  contact: "9123456789"
});

📦 3. Create Subscription

const subscription = await razorpay.subscriptions.create({
  plan_id: "plan_xyz",
  customer_notify: 1,
  total_count: 12,
  customer_id: customer.id,
  start_at: <timestamp>
});

🌐 4. Generate Payment Page
Send the returned short_url to frontend or embed Razorpay Checkout.

🧾 5. Handle Webhooks
Events to listen for:

subscription.activated

subscription.charged

payment.failed

subscription.completed

app.post('/api/subscribe/webhook', (req, res) => {
  // Verify Razorpay signature if needed
  const event = req.body.event;
  if (event === 'subscription.charged') {
    // Save payment success
  }
  res.status(200).send("OK");
});

❌ 6. Cancel Subscription

await razorpay.subscriptions.cancel(subscription_id, { cancel_at_cycle_end: true });

✅ Razorpay Implementation

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

Pausing a Subscription
    
const axios = require('axios');

async function pauseSubscription(subscriptionId) {
    const response = await axios.post(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/pause`, {
        pause_at_cycle_end: true // Subscription pauses at the cycle's end
    }, {
        headers: { Authorization: `Basic ${process.env.RAZORPAY_AUTH}` }
    });
    console.log('Subscription paused:', response.data);
}

Resuming a Subscription
    
async function resumeSubscription(subscriptionId) {
    const response = await axios.post(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/resume`, {}, {
        headers: { Authorization: `Basic ${process.env.RAZORPAY_AUTH}` }
    });
    console.log('Subscription resumed:', response.data);
}
