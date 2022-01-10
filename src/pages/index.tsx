import { GetServerSideProps, GetStaticProps } from 'next';
import Head from 'next/head'
import { stripe } from '../services/stripe';
import { SubscribeButton } from '../components/SubscribeButton';
import styles from './home.module.scss';

interface HomeProps {
  product: {
    priceId: string;
    amount: string;
  }
}

export default function Home({ product }: HomeProps) {
  return (
    <div>
        <Head>
        <title>Inicio | Ig.News</title>
      </Head>
      
      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span>
            👏 Hey, welcome
          </span>

          <h1>News about <br /> the <span>React</span> word.</h1>

          <p>
            Get access to all the publications <br />
            <span>from {product.amount} month</span>
          </p>

          <SubscribeButton priceId={product.priceId}/>
        </section>

        <img src="images/avatar.svg" alt="Girl coding" />
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const price =  await stripe.prices.retrieve('price_1KC7n7AtaxFDmhnW9RMtXk7p');

  const product = {
    priceId: price.id,
    amount: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price.unit_amount / 100),
    
  }
  
  return {
    props: {
      product
    },
    revalidate: 60 * 60 * 24, // 24hours
  }
}