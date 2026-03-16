import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// GET /api/queue - Get queue configuration and upcoming items
export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const accountId = searchParams.get('accountId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Get queue config
    const queue = await prisma.contentQueue.findFirst({
      where: {
        workspaceId,
        ...(accountId && { accountId }),
        isActive: true
      }
    })

    // Get upcoming queue items
    const upcomingItems = await prisma.queueItem.findMany({
      where: {
        queueId: queue?.id,
        scheduledSlot: { gte: new Date() },
        status: { in: ['PENDING', 'READY', 'SCHEDULED'] }
      },
      orderBy: { scheduledSlot: 'asc' },
      take: 20
    })

    return NextResponse.json({ queue, upcomingItems })
  } catch (error) {
    console.error('Queue fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }
}

// POST /api/queue - Create or update queue configuration
export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workspaceId,
      accountId,
      name,
      timeSlots,
      useEvergreen,
      useAiDrafts,
      useTemplates,
      categories,
      tags,
      maxPerDay,
      minInterval
    } = body

    if (!workspaceId || !accountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert queue config
    const queue = await prisma.contentQueue.upsert({
      where: {
        // Use a composite unique constraint
        id: `${workspaceId}_${accountId}`
      },
      update: {
        ...(name && { name }),
        ...(timeSlots && { timeSlots }),
        ...(useEvergreen !== undefined && { useEvergreen }),
        ...(useAiDrafts !== undefined && { useAiDrafts }),
        ...(useTemplates !== undefined && { useTemplates }),
        ...(categories && { categories }),
        ...(tags && { tags }),
        ...(maxPerDay && { maxPerDay }),
        ...(minInterval && { minInterval })
      },
      create: {
        id: `${workspaceId}_${accountId}`,
        workspaceId,
        accountId,
        name: name || 'Default Queue',
        timeSlots: timeSlots || [],
        useEvergreen: useEvergreen ?? false,
        useAiDrafts: useAiDrafts ?? true,
        useTemplates: useTemplates ?? true,
        categories: categories || [],
        tags: tags || [],
        maxPerDay: maxPerDay || 5,
        minInterval: minInterval || 60
      }
    })

    return NextResponse.json({ queue })
  } catch (error) {
    console.error('Queue update error:', error)
    return NextResponse.json({ error: 'Failed to update queue' }, { status: 500 })
  }
}
