const stripe = require('../config/stripe');
const User = require('../models/User');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/webhook', async (req, res) => {
    const event = req.body;
    
    if (event.type === 'invoice.payment_failed') {
        const userId = event.data.object.customer;
        await notifyUser(userId, 'Payment failed. Please update your payment details.');
    }

    res.sendStatus(200);
});

exports.stripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.sendStatus(400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customer = await stripe.customers.retrieve(session.customer);
      const user = await User.findOne({ email: customer.email });
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      user.subscription = {
        subscriptionId: subscription.id,
        priceId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      };
      await user.save();
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customer = await stripe.customers.retrieve(invoice.customer);
      const user = await User.findOne({ email: customer.email });
      console.warn(`Payment failed for ${user.email}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const user = await User.findOne({ 'subscription.subscriptionId': subscription.id });
      if (user) {
        user.subscription.status = 'canceled';
        await user.save();
      }
      break;
    }
  }

  res.json({ received: true });
};
