// frontend/src/utils/stripe.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51R6S0aRxHqAQ3douI7ejF3vst7YpsSUZDL2AfhUeJjN41P0mbXJ0tJ3at7sGJVP2FfYVilnaPX2tgUQ4oVTNYnZ200CZNmr4Eg'); // Replace with your Stripe Publishable Key

export default stripePromise;