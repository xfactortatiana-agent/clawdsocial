import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({
  id: "clawdsocial",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event types
export interface PostScheduledEvent {
  name: "post.scheduled";
  data: {
    postId: string;
    accountId: string;
    scheduledFor: string;
  };
}

export interface PostPublishEvent {
  name: "post.publish";
  data: {
    postId: string;
    accountId: string;
    retryCount?: number;
  };
}

export interface TokenRefreshEvent {
  name: "token.refresh";
  data: {
    accountId: string;
  };
}

export type Events = PostScheduledEvent | PostPublishEvent | TokenRefreshEvent;
