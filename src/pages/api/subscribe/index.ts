import { NextApiRequest, NextApiResponse } from "next";
import  { query as q } from 'faunadb';
import { getSession } from "next-auth/react";
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

interface User {
  ref: {
    id: string;
  },
  data: {
    stripe_custumer_id: string;
  }
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'POST': {
      const { priceId } = req.body;

      const session = await getSession({req});
      
      const user = await fauna.query<User>(
        q.Get(
          q.Match(
            q.Index('user_by_email'),
            q.Casefold(session.user.email),
          )
        )
      )

      let custumerId = user.data.stripe_custumer_id;

      if (!custumerId) {
        const stripeCustomer = await stripe.customers.create({
          email:session.user.email,
        })

        await fauna.query(
          q.Update(
            q.Ref(q.Collection('users'), user.ref.id),
            {
              data: {
                stripe_custumer_id: stripeCustomer.id,
              }
            }
          )
        )

        custumerId = stripeCustomer.id;
      }
      
      const stripeCheckoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        billing_address_collection:  'required',
        line_items: [
          { price: priceId, quantity: 1 }
        ],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: process.env.STRIPE_SUCCESS_URL,
        cancel_url:  process.env.STRIPE_CANCEL_URL,
        customer: custumerId,
      });

      console.log(stripeCheckoutSession);

      return res.status(200).json({ sessionId: stripeCheckoutSession.id })
    }

    default: {

      res.setHeader('Allow', 'POST')
      res.status(405).end('Method not allowed')
      
      break;
    }
      
  }
}