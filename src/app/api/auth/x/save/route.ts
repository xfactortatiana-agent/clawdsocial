import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, name, pfp, clerkId } = body

    if (!username || !clerkId) {
      return NextResponse.json({ error: 'Username and clerkId required' }, { status: 400 })
    }

    // Create or get user
    const dbUser = await prisma.user.upsert({
      where: { clerkId },
      update: {
        name: name || username,
        imageUrl: pfp
      },
      create: {
        clerkId,
        email: `${clerkId}@clawdsocial.local`,
        name: name || username,
        imageUrl: pfp
      }
    })

    // Create workspace
    const workspace = await prisma.workspace.upsert({
      where: { slug: `user-${clerkId.slice(-8)}` },
      update: {},
      create: {
        name: `${name || username}'s Workspace`,
        slug: `user-${clerkId.slice(-8)}`,
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
        accessToken: 'pending',
        isActive: true
      }
    })

    return NextResponse.json({ success: true, account: socialAccount })
  } catch (err) {
    console.error('Save X connection error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
