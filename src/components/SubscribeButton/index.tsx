import { signIn, useSession } from 'next-auth/react';
import { api } from '../../services/api';
import { getStripeJs } from '../../services/stripe-js';
import styles from './styles.module.scss';

interface SubscribeButtonProps {
  priceId: string;
}
export function  SubscribeButton({ priceId }: SubscribeButtonProps) {
  const  { data: session } = useSession();
  
  const handleSubscribe = async () => {
    if (!session) {
      signIn('github');
      return;
    }

    try {

      const {data: { sessionId }} = await api.post('/subscribe', { priceId });
    
      const stripe = await getStripeJs();
  
      await stripe.redirectToCheckout({sessionId});
    } catch (error) {
      console.log(error);
    }

  };
  return (
    <button type="button" className={styles.subscribeButton} onClick={handleSubscribe}>
      Subscribe now
    </button>
  )
}