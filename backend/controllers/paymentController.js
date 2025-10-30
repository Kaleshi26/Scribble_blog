// backend/controllers/paymentController.js
import Stripe from 'stripe';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, currency = 'usd' } = req.body;
    const userId = req.user.id;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        userId: userId.toString(),
      },
    });

    // Save payment record
    const payment = new Payment({
      user: userId,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      status: 'pending',
    });

    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create subscription
export const createSubscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { priceId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let customerId = user.subscription?.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user with customer ID
    await User.findByIdAndUpdate(userId, {
      'subscription.stripeCustomerId': customerId,
      'subscription.stripeSubscriptionId': subscription.id,
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get subscription
export const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('subscription');

    if (!user || !user.subscription?.stripeSubscriptionId) {
      return res.json({ subscription: null });
    }

    const subscription = await stripe.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId
    );

    res.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('subscription');

    if (!user || !user.subscription?.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);

    // Update user subscription
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': 'free',
      'subscription.endDate': new Date(),
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Stripe webhook
export const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Helper functions
const handlePaymentSuccess = async (paymentIntent) => {
  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    { status: 'succeeded' },
    { new: true }
  );

  if (payment) {
    // Update user stats or send confirmation email
    console.log('Payment succeeded:', payment._id);
  }
};

const handleSubscriptionCreated = async (subscription) => {
  const customerId = subscription.customer;
  const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

  if (user) {
    const plan = subscription.items.data[0].price.nickname || 'premium';
    await User.findByIdAndUpdate(user._id, {
      'subscription.plan': plan,
      'subscription.startDate': new Date(subscription.current_period_start * 1000),
      'subscription.endDate': new Date(subscription.current_period_end * 1000),
    });
  }
};

const handleSubscriptionUpdated = async (subscription) => {
  const customerId = subscription.customer;
  const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

  if (user) {
    const plan = subscription.items.data[0].price.nickname || 'premium';
    await User.findByIdAndUpdate(user._id, {
      'subscription.plan': plan,
      'subscription.endDate': new Date(subscription.current_period_end * 1000),
    });
  }
};

const handleSubscriptionDeleted = async (subscription) => {
  const customerId = subscription.customer;
  const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

  if (user) {
    await User.findByIdAndUpdate(user._id, {
      'subscription.plan': 'free',
      'subscription.endDate': new Date(),
    });
  }
};
