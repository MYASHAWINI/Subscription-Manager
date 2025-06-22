---

### 🔧 **Project Title: Subscription Manager**

---

### 📄 **Description**

Build a subscription management system to handle user signups, upgrades, downgrades, cancellations, payment processing via Stripe or Razorpay, and send alerts for renewals or failures.

---

### 🎯 **Main Objectives**

* Allow users to:

  * Subscribe to plans
  * Upgrade or downgrade subscriptions
  * Cancel or resume subscriptions
* Handle trial periods and renewals
* Send notifications for upcoming renewals or payment issues
* Enable admin insights into subscription activity

---

### 🧰 **Technologies Stack**

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose for ODM)
* **Payment Gateway:** Stripe **or** Razorpay
* **Authentication:** JWT-based auth
* **Notification:** Email via Nodemailer or console logs
* **Admin Interface:** Optional Express-based dashboard or frontend (e.g., React if extended)

---

### 📦 **Core Features**

1. **User Authentication**

   * Signup/login with JWT
   * Password hashing (bcrypt)

2. **Subscription Management**

   * Plans: Create, read, update (admin-only)
   * User subscription: Start, upgrade, downgrade, cancel, resume

3. **Billing History**

   * Show user transaction history
   * Pull data from MongoDB or payment gateway API

4. **Payment Handling**

   * Integration with Stripe/Razorpay
   * Use webhooks to track:

     * Payment success/failure
     * Subscription status changes
     * Invoice generation

5. **Trial Periods**

   * Store and track trial start/end dates
   * Trigger trial end notifications

6. **Notifications**

   * Email or log alerts for:

     * Trial end
     * Payment failures
     * Upcoming renewals (use cron jobs)

---

### 💳 **Payment Handling**

* **Stripe**

  * `checkout.sessions`, `subscriptions`, and `webhooks` for automation
* **Razorpay**

  * `subscriptions`, `invoices`, and webhook handling for events like `payment.failed`, `subscription.charged`

**Webhook Endpoint Example:**

```js
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    // handle event type
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  res.json({received: true});
});
```

---

### 🧮 **Database Models (MongoDB via Mongoose)**

#### User Model

```js
{
  email: String,
  passwordHash: String,
  stripeCustomerId: String,
  subscription: {
    planId: String,
    status: String,
    trialEndsAt: Date,
    currentPeriodEnd: Date
  }
}
```

#### Plan Model (Optional - useful if plans are not static)

```js
{
  name: String,
  price: Number,
  interval: String,
  features: [String],
  stripePlanId: String
}
```

---

### 📬 **Notification System**

* **Renewal Reminders:**

  * Use a cron job to check for renewals due in 3 days
* **Failed Payments:**

  * Triggered by webhooks
* **Trial End Alerts:**

  * Notify 1 day before trial ends

---

### 💡 **Bonus Features**

* **Admin Dashboard**

  * View all users, subscriptions, active plans
* **Pause/Resume Subscriptions**

  * Supported via Stripe API (`pause_collection`)
* **Dynamic Plan API**

  * Expose CRUD API to manage plans (admin-only)

---

### 🧪 **Skills Practiced**

* Secure REST API development with Express & JWT
* Payment gateway integration with webhooks
* Full subscription lifecycle handling
* MongoDB schema design for scalable user and billing data

---


