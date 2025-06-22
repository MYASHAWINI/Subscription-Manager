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

# Pause
    
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

# Resume
    
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
