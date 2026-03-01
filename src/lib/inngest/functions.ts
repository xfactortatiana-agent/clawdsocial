import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";

// Post publishing function with retries
export const publishPostFunction = inngest.createFunction(
  {
    id: "publish-post",
    retries: 3,
    onFailure: async ({ event, error }) => {
      const eventData = (event.data as unknown) as { postId: string; accountId: string };
      const post = await prisma.post.findUnique({
        where: { id: eventData.postId },
        include: { 
          account: { include: { workspace: true } },
          createdBy: true
        }
      });
      
      if (post) {
        await prisma.post.update({
          where: { id: eventData.postId },
          data: { status: 'FAILED' }
        });
        
        if (post.createdBy?.email) {
          await sendNotificationEmail({
            to: post.createdBy.email,
            subject: "Post Failed to Publish",
            content: `Your scheduled post failed to publish after 3 attempts. Error: ${error.message}. Please check your account connection and try again.`
          });
        }
      }
    }
  },
  { event: "post.publish" },
  async ({ event, step }) => {
    const { postId, accountId } = event.data as { postId: string; accountId: string };
    
    const post = await step.run("fetch-post", async () => {
      return prisma.post.findUnique({
        where: { id: postId },
        include: { account: true }
      });
    });
    
    if (!post || post.status !== 'SCHEDULED') {
      throw new Error("Post not found or not scheduled");
    }
    
    await step.run("validate-media", async () => {
      const mediaUrls = post.mediaUrls || [];
      for (const url of mediaUrls) {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Media validation failed: ${url}`);
        }
      }
    });
    
    const publishResult = await step.run("publish-to-x", async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/post/x`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          accountId,
          content: post.content,
          mediaUrls: post.mediaUrls
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to publish");
      }
      
      return response.json();
    });
    
    await step.run("update-status", async () => {
      return prisma.post.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          platformPostId: publishResult.tweetId,
          postUrl: publishResult.url
        }
      });
    });
    
    await step.run("notify-success", async () => {
      const user = await prisma.user.findUnique({
        where: { id: post.createdById }
      });
      
      if (user?.email) {
        await sendNotificationEmail({
          to: user.email,
          subject: "Post Published Successfully",
          content: `Your post has been published! View it here: ${publishResult.url}`
        });
      }
    });
    
    return { success: true, tweetId: publishResult.tweetId };
  }
);

// Token refresh function
export const tokenRefreshFunction = inngest.createFunction(
  {
    id: "refresh-tokens",
    retries: 2
  },
  { event: "token.refresh" },
  async ({ event, step }) => {
    const { accountId } = event.data as { accountId: string };
    
    const account = await step.run("fetch-account", async () => {
      return prisma.socialAccount.findUnique({
        where: { id: accountId }
      });
    });
    
    if (!account || !account.refreshToken) {
      throw new Error("Account not found or no refresh token");
    }
    
    try {
      const refreshed = await step.run("refresh-x-token", async () => {
        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken!,
            client_id: process.env.X_CLIENT_ID || ''
          })
        });
        
        if (!response.ok) {
          throw new Error("Token refresh failed");
        }
        
        return response.json();
      });
      
      await step.run("update-tokens", async () => {
        return prisma.socialAccount.update({
          where: { id: accountId },
          data: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || account.refreshToken,
            lastSyncedAt: new Date()
          }
        });
      });
      
      return { success: true };
      
    } catch (error) {
      await step.run("notify-reconnect", async () => {
        const workspace = await prisma.workspace.findUnique({
          where: { id: account.workspaceId }
        });
        
        const owner = workspace ? await prisma.user.findUnique({
          where: { id: workspace.ownerId }
        }) : null;
        
        if (owner?.email) {
          await sendNotificationEmail({
            to: owner.email,
            subject: "Action Required: Reconnect Your X Account",
            content: `Your X account @${account.accountHandle} needs to be reconnected. Please go to Settings > Connected Accounts to reconnect.`
          });
        }
      });
      
      throw error;
    }
  }
);

// Scheduled post processor (runs every minute)
export const scheduledPostProcessor = inngest.createFunction(
  {
    id: "process-scheduled-posts"
  },
  { cron: "* * * * *" },
  async ({ step }) => {
    const now = new Date();
    
    const postsToPublish = await step.run("find-scheduled-posts", async () => {
      return prisma.post.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledFor: {
            lte: now
          }
        },
        include: { account: true }
      });
    });
    
    for (const post of postsToPublish) {
      await step.run(`queue-post-${post.id}`, async () => {
        await inngest.send({
          name: "post.publish",
          data: {
            postId: post.id,
            accountId: post.accountId
          }
        });
      });
    }
    
    return { queued: postsToPublish.length };
  }
);

// Daily token refresh check
export const dailyTokenRefresh = inngest.createFunction(
  {
    id: "daily-token-refresh"
  },
  { cron: "0 2 * * *" },
  async ({ step }) => {
    const accounts = await step.run("find-accounts", async () => {
      return prisma.socialAccount.findMany({
        where: {
          isActive: true,
          platform: 'X'
        }
      });
    });
    
    for (const account of accounts) {
      await step.run(`refresh-${account.id}`, async () => {
        await inngest.send({
          name: "token.refresh",
          data: { accountId: account.id }
        });
      });
    }
    
    return { checked: accounts.length };
  }
);

// Export all functions
export const functions = [
  publishPostFunction,
  tokenRefreshFunction,
  scheduledPostProcessor,
  dailyTokenRefresh
];
