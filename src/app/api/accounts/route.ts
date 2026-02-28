import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get user from our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ accounts: [] })
    }

    // Get user's workspace
    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: dbUser.id }
    })

    if (!workspace) {
      return NextResponse.json({ accounts: [] })
    }

    // Get X accounts
    const accounts = await prisma.socialAccount.findMany({
      where: { 
        workspaceId: workspace.id,
        platform: 'X'
      }
    })

    return NextResponse.json({ accounts })
  } catch (err) {
    console.error('Error fetching accounts:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
