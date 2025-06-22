<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscribe with Stripe Elements</title>
  <script src="https://js.stripe.com/v3/"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
    }
    .card-element {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 20px;
      width: 300px;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
    }
    #card-errors {
      color: red;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h2>Subscribe to a Plan</h2>
  <form id="subscription-form">
    <label for="plan">Select Plan:</label>
    <select id="plan" required>
      <option value="basic">Basic</option>
      <option value="premium">Premium</option>
    </select>
    <div>
      <label>Credit Card:</label>
      <div id="card-element" class="card-element"></div>
      <div id="card-errors" role="alert"></div>
    </div>
    <button type="submit">Pay & Subscribe</button>
  </form>

  <script>
    // Replace with your Stripe publishable key
    const stripe = Stripe('your_publishable_key');

    // Create an instance of Stripe Elements
    const elements = stripe.elements();

    // Custom styling for Elements
    const style = {
      base: {
        fontSize: '16px',
        color: '#32325d',
      }
    };

    // Create an instance of the card Element
    const card = elements.create('card', { style: style });
    // Mount the card Element
    card.mount('#card-element');

    // Handle real-time validation errors
    card.on('change', ({ error }) => {
      document.getElementById('card-errors').textContent = error ? error.message : '';
    });

    // Handle form submission
    document.getElementById('subscription-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const plan = document.getElementById('plan').value;

      // 1. Create a payment intent or checkout session on your backend
      const response = await fetch('http://localhost:3000/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (!data.clientSecret) {
        alert('Error creating payment.');
        return;
      }

      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: card,
        }
      });

      if (result.error) {
        // Show error to your customer
        document.getElementById('card-errors').textContent = result.error.message;
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          alert('Payment succeeded! Subscription activated.');
          // Optionally, call backend to update subscription status
        }
      }
    });
  </script>
</body>
</html>
