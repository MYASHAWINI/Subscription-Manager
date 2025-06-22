const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
module.exports = stripe;

✅ Stripe Implementation

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
