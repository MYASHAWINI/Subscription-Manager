const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['Basic', 'Standard', 'Premium'], required: true },
  status: { type: String, enum: ['Active', 'Cancelled', 'Paused', 'Expired'], default: 'Active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  trialPeriod: { type: Boolean, default: false },
  paymentDetails: {
    gateway: { type: String, enum: ['Stripe', 'Razorpay'], required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['Success', 'Failed', 'Pending'], required: true }
  },
  renewalNotifications: [
    {
      date: { type: Date, required: true },
      method: { type: String, enum: ['Email', 'SMS', 'Webhook'], required: true }
    }
  ]
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
