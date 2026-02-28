import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's workspace
    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: dbUser.id }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Delete the account (verify it belongs to user's workspace)
    await prisma.socialAccount.deleteMany({
      where: { 
        id: params.id,
        workspaceId: workspace.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting account:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
