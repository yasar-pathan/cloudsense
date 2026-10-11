// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://74552fcd380a1a2ed03c8ad88a27ad2e@o4512219399323649.ingest.de.sentry.io/4512221696884816",

  // Add optional integrations for additional features (production only to keep dev fast)
  integrations:
    process.env.NODE_ENV === "production" ? [Sentry.replayIntegration()] : [],

  // Define how likely traces are sampled. Keep low in dev to avoid request overhead.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0.0,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
