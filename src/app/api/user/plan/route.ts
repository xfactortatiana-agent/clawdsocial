import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ plan: 'FREE' });
    }

    return NextResponse.json({ plan: user.plan });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return NextResponse.json({ plan: 'FREE' });
  }
}
