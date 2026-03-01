import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { PlanId, PLANS } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or secret' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    console.log('Stripe webhook:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId as PlanId;

        if (userId && planId) {
          // Update user's plan
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planId.toUpperCase() as 'FREE' | 'PRO' | 'AGENCY' | 'ENTERPRISE',
              stripeCustomerId: session.customer as string,
            },
          });

          console.log(`User ${userId} upgraded to ${planId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        // Update subscription status
        if (subscriptionId) {
          await stripe.subscriptions.update(subscriptionId, {
            metadata: {
              lastPaymentStatus: 'succeeded',
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        // Find user and downgrade to free
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'FREE' },
          });

          console.log(`User ${user.id} downgraded to FREE due to failed payment`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user and downgrade to free
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'FREE' },
          });

          console.log(`User ${user.id} subscription cancelled, downgraded to FREE`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
