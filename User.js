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
