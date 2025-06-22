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

✅ Summary

| Step | Action                                         |
| ---- | ---------------------------------------------- |
| 1️⃣  | Configure Stripe SDK & .env                    |
| 2️⃣  | Create Customer (on user registration)         |
| 3️⃣  | Generate Checkout Session                      |
| 4️⃣  | Listen to webhooks and store subscription info |
| 5️⃣  | Support upgrades/downgrades                    |
| 6️⃣  | Allow cancellation/resume                      |

---

1. 📁 **Sample Folder Structure** (Node.js + Express + Stripe + MongoDB)
2. 📬 **Postman Collection Outline** (you can import/test your APIs)
3. 💰 **Razorpay Flow** (parallel to the Stripe flow)

---

## 📁 **Sample Folder Structure**

```
subscription-manager/
│
├── config/
│   ├── db.js                # MongoDB connection
│   └── stripe.js            # Stripe config and SDK init
│
├── controllers/
│   ├── authController.js
│   ├── subscriptionController.js
│   └── webhookController.js
│
├── models/
│   ├── User.js
│   ├── Plan.js
│   └── Subscription.js
│
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── planRoutes.js
│   └── subscriptionRoutes.js
│
├── utils/
│   ├── sendEmail.js         # Nodemailer (optional)
│   └── notifications.js     # Trial/renewal notifications
│
├── middleware/
│   ├── authMiddleware.js    # JWT check
│   └── adminMiddleware.js   # Admin access check
│
├── .env
├── app.js                   # Main app setup
└── server.js                # Server start point
```

---

## 📬 **Postman Collection Outline**

### 🔐 Auth

* `POST /api/auth/register` – Create user
* `POST /api/auth/login` – Get token
* `GET /api/auth/me` – Profile

### 💳 Subscription

* `POST /api/subscribe/create-checkout` – Stripe checkout session
* `POST /api/subscribe/change-plan` – Upgrade/downgrade
* `POST /api/subscribe/cancel` – Cancel subscription
* `POST /api/subscribe/resume` – Resume
* `POST /api/subscribe/webhook` – Webhook (Stripe events)

### 📦 Plans

* `GET /api/plans/` – List all
* `POST /api/plans/` – Create (admin)
* `PUT /api/plans/:id` – Update (admin)
* `DELETE /api/plans/:id` – Delete (admin)

### 👤 User

* `GET /api/user/subscriptions` – Current subscription
* `GET /api/user/billing-history` – Past invoices

---

## 💰 **Razorpay Payment Flow**

### 🔁 1. Create Plan (one-time setup)

Use Razorpay Dashboard or API to define:

```json
{
  "period": "monthly",
  "interval": 1,
  "item": {
    "name": "Basic Plan",
    "amount": 99900,
    "currency": "INR"
  }
}
```

### 👤 2. Create Customer

```js
const customer = await razorpay.customers.create({
  name: "John Doe",
  email: "john@example.com",
  contact: "9123456789"
});
```

### 📦 3. Create Subscription

```js
const subscription = await razorpay.subscriptions.create({
  plan_id: "plan_xyz",
  customer_notify: 1,
  total_count: 12,
  customer_id: customer.id,
  start_at: <timestamp>
});
```

### 🌐 4. Generate Payment Page

* Send the returned `short_url` to frontend or embed Razorpay Checkout.

### 🧾 5. Handle Webhooks

Events to listen for:

* `subscription.activated`
* `subscription.charged`
* `payment.failed`
* `subscription.completed`

```js
app.post('/api/subscribe/webhook', (req, res) => {
  // Verify Razorpay signature if needed
  const event = req.body.event;
  if (event === 'subscription.charged') {
    // Save payment success
  }
  res.status(200).send("OK");
});
```

### ❌ 6. Cancel Subscription

```js
await razorpay.subscriptions.cancel(subscription_id, { cancel_at_cycle_end: true });
```

---
