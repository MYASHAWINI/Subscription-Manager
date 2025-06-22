const stripe = require('../config/stripe');
const User = require('../models/User');

const PlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true }, // e.g., 'basic', 'pro'
  name: String,
  price: Number,
  durationInDays: Number,
  features: [String],
});

const Plan = mongoose.model('Plan', PlanSchema);
module.exports = Plan;

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
