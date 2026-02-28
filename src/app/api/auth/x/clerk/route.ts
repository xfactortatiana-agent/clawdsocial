import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { username, name, pfp } = body

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Create or update user
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name: name || username,
        imageUrl: pfp
      },
      create: {
        clerkId: userId,
        email: `${userId.slice(0, 8)}@clawdsocial.local`,
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
    await prisma.socialAccount.upsert({
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
        accessToken: 'clerk-managed',
        isActive: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error saving X connection:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
