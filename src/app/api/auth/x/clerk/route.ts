import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get the user's OAuth access token from Clerk
    const clerkUser = await clerkClient.users.getUser(userId)
    
    // Check if user has X connected via Clerk
    const xAccount = clerkUser.externalAccounts.find(
      account => account.provider === 'x' || account.provider === 'twitter'
    )

    if (!xAccount) {
      return NextResponse.json({ error: 'X not connected' }, { status: 400 })
    }

    // Get username from X account
    const username = xAccount.username || xAccount.externalId
    const name = clerkUser.firstName || username
    const pfp = xAccount.imageUrl || clerkUser.imageUrl

    // Create or get user in our database
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name: name,
        imageUrl: pfp
      },
      create: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@clawdsocial.local`,
        name: name,
        imageUrl: pfp
      }
    })

    // Create workspace
    const workspace = await prisma.workspace.upsert({
      where: { slug: `user-${userId.slice(-8)}` },
      update: {},
      create: {
        name: `${name}'s Workspace`,
        slug: `user-${userId.slice(-8)}`,
        ownerId: dbUser.id
      }
    })

    // Save X connection
    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_accountHandle: {
          workspaceId: workspace.id,
          platform: 'X',
          accountHandle: username
        }
      },
      update: {
        accountName: name,
        profileImageUrl: pfp,
        isActive: true
      },
      create: {
        workspaceId: workspace.id,
        platform: 'X',
        accountHandle: username,
        accountName: name,
        profileImageUrl: pfp,
        accessToken: 'clerk-managed',
        isActive: true
      }
    })

    return NextResponse.json({ success: true, username })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
