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
