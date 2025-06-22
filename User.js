<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscribe</title>
  <script src="https://js.stripe.com/v3/"></script>
</head>
<body>
  <h1>Subscribe to a Plan</h1>
  <button id="subscribe-basic">Subscribe to Basic</button>
  <button id="subscribe-premium">Subscribe to Premium</button>

  <script>
    const stripe = Stripe('your_publishable_key'); // Replace with your Stripe publishable key

    document.getElementById('subscribe-basic').onclick = () => {
      createCheckoutSession('basic');
    };

    document.getElementById('subscribe-premium').onclick = () => {
      createCheckoutSession('premium');
    };

    async function createCheckoutSession(plan) {
      // Call your backend to create the session
      const response = await fetch('http://localhost:3000/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer your_jwt_token_here' // optional, if auth is required
        },
        body: JSON.stringify({ plan: plan }),
      });
      const data = await response.json();

      if (data.sessionId) {
        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) {
          alert(result.error.message);
        }
      } else {
        alert('Failed to create checkout session');
      }
    }
  </script>
</body>
</html>
