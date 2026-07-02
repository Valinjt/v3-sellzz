const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { amount, summary, name, ig } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['cashapp'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: summary || 'V1 Order' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://v1.netlify.app?payment=success',
      cancel_url: 'https://v1.netlify.app?payment=cancelled',
      metadata: { name: name || '', ig: ig || '' },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};