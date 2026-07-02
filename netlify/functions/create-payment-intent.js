const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!event.body) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No body provided' }) };
  }

  try {
    const { amount, summary, name, ig } = JSON.parse(event.body);

    if (!amount || amount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'cashapp'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: summary || 'V1 Shoe Order',
              description: `Customer: ${name || 'Unknown'} | Instagram: ${ig || 'N/A'}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://vreselling.netlify.app?payment=success',
      cancel_url: 'https://vreselling.netlify.app?payment=cancelled',
      metadata: {
        customer_name: name || '',
        instagram: ig || '',
        item: summary || '',
      },
      customer_email: undefined,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};