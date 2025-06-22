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

js
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

js
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: false,
});

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
module.exports = stripe;

✅ Stripe Implementation

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/subscriptions', async (req, res) => {
  const { userId, planId } = req.body;
  const user = await User.findById(userId);
  
  const product = await stripe.products.create({ name: planId });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1000, // amount in cents
    currency: 'usd',
  });
  
  const subscription = await stripe.subscriptions.create({
    customer: user.stripeCustomerId,
    items: [{ price: price.id }],
    expand: ['latest_invoice.payment_intent'],
  });

  // Save subscription details in MongoDB
  await Subscription.create({
    userId,
    stripeSubscriptionId: subscription.id,
    planId,
    status: 'active',
    startDate: new Date(),
  });

  res.json(subscription);
});

async function pauseSubscription(subscriptionId) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: { behavior: 'keep_as_draft' } // Keeps invoice drafts instead of canceling
    });
    console.log('Subscription paused:', subscription.id);
}

pauseSubscription('sub_12345'); // Example subscription ID

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

---

## 🧰 **1. Stripe Configuration**

### 🔑 `.env`

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DOMAIN=http://localhost:3000

### ⚙️ `config/stripe.js`

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
module.exports = stripe;

---

## 🗃️ **2. MongoDB Schema**

### 🧑 `models/User.js`

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  stripeCustomerId: String,
  subscription: {
    subscriptionId: String,
    priceId: String,
    status: String,
    currentPeriodEnd: Date,
    trialEndsAt: Date
  }
});

module.exports = mongoose.model('User', userSchema);

---

## 🚀 **3. Create Stripe Checkout Session**

### 🔁 `controllers/subscriptionController.js`

js
const stripe = require('../config/stripe');
const User = require('../models/User');

exports.createCheckoutSession = async (req, res) => {
  const userId = req.user.id;
  const { priceId } = req.body;
  const user = await User.findById(userId);

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN}/cancel`,
  });

  res.json({ url: session.url });
};
```
---

## 📩 **4. Handle Stripe Webhooks**

### 📡 `controllers/webhookController.js`

```js
const stripe = require('../config/stripe');
const User = require('../models/User');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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


> ⚠️ **Important**: Webhook route must be raw body middleware:

app.post('/api/subscribe/webhook', express.raw({ type: 'application/json' }), webhookController.stripeWebhook);

---

## 🔄 **5. Change Plan (Upgrade/Downgrade)**

js
exports.changePlan = async (req, res) => {
  const user = await User.findById(req.user.id);
  const subscriptionId = user.subscription.subscriptionId;

  const currentSub = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItemId = currentSub.items.data[0].id;

  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: subscriptionItemId, price: req.body.newPriceId }],
    proration_behavior: 'create_prorations'
  });

  user.subscription.priceId = req.body.newPriceId;
  await user.save();
  res.json({ updated });
};

---

## ❌ **6. Cancel / Resume Subscription**

### Cancel

js
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true,
});


### Resume

js
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: false,
});

---
