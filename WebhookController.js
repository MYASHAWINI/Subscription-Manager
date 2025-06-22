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

app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'your_stripe_webhook_secret';

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve customer info, payment details, etc.
    const plan = session.metadata.plan;
    const transactionId = session.payment_intent;
    const amount = session.amount_total;
    const currency = session.currency;

    // Create subscription record
    const userId = /* retrieve from session or your storage */;
    const endDate = new Date(); // calculate based on plan
    endDate.setMonth(endDate.getMonth() + 1); // e.g., 1 month

    await new Subscription({
      userId,
      plan,
      status: 'Active',
      startDate: new Date(),
      endDate,
      paymentDetails: {
        gateway: 'Stripe',
        transactionId,
        amount,
        currency,
        status: 'Success'
      }
    }).save();

    // You might notify user here as well
  }
  res.json({ received: true });
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
