const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const stripe = Stripe('your_stripe_secret_key'); // replace with your Stripe secret key

const app = express();
app.use(express.json());
app.use('/webhook', express.raw({ type: 'application/json' })); // for webhook endpoint

const JWT_SECRET = 'your_jwt_secret'; // use secure value in production

// --- MongoDB connection ---
mongoose.connect('your_mongodb_uri', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(console.error);

// --- Schemas ---

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  subscription: {
    plan: { type: String },      // e.g., 'basic', 'premium'
    status: { type: String },    // e.g., 'active', 'cancelled', 'paused'
    startDate: { type: Date },
    endDate: { type: Date },
    trialEndDate: { type: Date },
    paymentId: { type: String }, // ID from payment gateway
  },
  billingHistory: [
    {
      paymentId: String,
      amount: Number,
      date: Date,
      status: String, // success, failed, refunded
    }
  ],
}, { timestamps: true });

module.exports = User;

const PlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true }, // e.g., 'basic', 'pro'
  name: String,
  price: Number,
  durationInDays: Number,
  features: [String],
});

module.exports = Plan;

const User = mongoose.model('User', userSchema);
const Plan = mongoose.model('Plan', planSchema);

// --- Seed some plans (run once) ---
const seedPlans = async () => {
  const plans = [
    { planId: 'basic', name: 'Basic Plan', price: 1000 },
    { planId: 'premium', name: 'Premium Plan', price: 2500 },
  ];
  for (const p of plans) {
    const exists = await Plan.findOne({ planId: p.planId });
    if (!exists) await new Plan(p).save();
  }
};
// seedPlans();

const Plan = require('./models/Plan'); // your Plan schema

app.post('/subscribe', authMiddleware, async (req, res) => {
  const { plan } = req.body;
  const userId = req.userId;

  try {
    // Validate the plan
    const planExists = await Plan.findOne({ planId: plan });
    if (!planExists) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update the user subscription
    user.subscription = {
      plan: plan,
      status: 'active',
      startDate: new Date(),
      endDate: null, // define if your plans have expiry
    };

    await user.save();

    res.json({ message: `Successfully subscribed to ${planExists.name}`, subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription', error });
  }
});

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.userId = decoded.userId;
    next();
  });
};

// --- Registration ---
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash: hash, name });
    await user.save();
    res.json({ message: 'Registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Login ---
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Create Stripe Checkout Session ---
app.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const { plan } = req.body;
  try {
    const planObj = await Plan.findOne({ planId: plan });
    if (!planObj) return res.status(400).json({ message: 'Invalid plan' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: planObj.name },
          unit_amount: planObj.price,
        },
        quantity: 1,
      }],
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        userId: user._id.toString(),
        planId: planObj.planId,
      },
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Webhook endpoint ---
const endpointSecret = 'your_stripe_webhook_secret';

app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;
    const paymentIntentId = session.payment_intent;
    const amountPaid = session.amount_total / 100;

    User.findById(userId).then(user => {
      if (user) {
        user.subscription = {
          plan: planId,
          status: 'active',
          startDate: new Date(),
          paymentId: paymentIntentId,
        };

        
        user.save().catch(console.error);
      }
    }).catch(console.error);
  }

  res.json({ received: true });
});

// --- Run server ---
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
