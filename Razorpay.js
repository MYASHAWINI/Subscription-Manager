✅ Razorpay Implementation

const axios = require('axios');

async function pauseSubscription(subscriptionId) {
    const response = await axios.post(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/pause`, {
        pause_at_cycle_end: true // Subscription pauses at the cycle's end
    }, {
        headers: { Authorization: `Basic ${process.env.RAZORPAY_AUTH}` }
    });
    console.log('Subscription paused:', response.data);
}

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
