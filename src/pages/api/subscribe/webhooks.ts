import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../../services/stripe";
import { saveSubscription } from "../_lib/manageSubscription";

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunck of readable) {
    chunks.push(
      typeof chunck === 'string' ? Buffer.from(chunck) : chunck,
    )
  }

  return Buffer.concat(chunks)
}

export const config = {
  api: {
    bodyParser: false,
  }
}

const relevantsEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])
export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const secret = req.headers['stripe-signature'];

    let event: Stripe.Event;


    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log(`Webhook error: ${err.message}`);
      return res.status(400).send(`Webhook error: ${err.message}`)
    }

    const {type} = event;

    if (relevantsEvents.has(type)) {
      try {
        switch (type) {
          case 'checkout.session.completed': 
            const checkoutSession = event.data.object as Stripe.Checkout.Session;

            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            );

            break;
  
          case'customer.subscription.updated':
          case'customer.subscription.deleted':
              const subscription = event.data.object as Stripe.Subscription;
              console.log('aqui', subscription)

              await saveSubscription(
                subscription.id,
                subscription.customer.toString(),
              )
            break;
          default: 
            throw new Error('Unhandled event')
        }
      } catch (error) {
        return res.json({error: 'Webhook handle failure'})
      }
    }

    return res.json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method not allowed')
  }
}