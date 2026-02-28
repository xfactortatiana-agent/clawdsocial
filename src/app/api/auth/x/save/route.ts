import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { username, name, pfp } = body

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Create or get user
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name: name || username,
        imageUrl: pfp
      },
      create: {
        clerkId: userId,
        email: `${userId}@clawdsocial.local`,
        name: name || username,
        imageUrl: pfp
      }
    })

    // Create workspace
    const workspace = await prisma.workspace.upsert({
      where: { slug: `user-${userId.slice(-8)}` },
      update: {},
      create: {
        name: `${name || username}'s Workspace`,
        slug: `user-${userId.slice(-8)}`,
        ownerId: dbUser.id
      }
    })

    // Save X account
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_accountHandle: {
          workspaceId: workspace.id,
          platform: 'X',
          accountHandle: username
        }
      },
      update: {
        accountName: name || username,
        profileImageUrl: pfp,
        isActive: true
      },
      create: {
        workspaceId: workspace.id,
        platform: 'X',
        accountHandle: username,
        accountName: name || username,
        profileImageUrl: pfp,
        accessToken: 'pending', // We need to get this from OAuth
        isActive: true
      }
    })

    return NextResponse.json({ success: true, account: socialAccount })
  } catch (err) {
    console.error('Save X connection error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
