"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [sentMessage, setSentMessage] = useState(false);

  const triggerClientError = () => {
    throw new Error("Sentry Frontend Client Test Error: CloudSense verified!");
  };

  const triggerCapturedException = () => {
    try {
      // Trigger intentional error
      const undefinedObj = undefined;
      undefinedObj.triggerCrash();
    } catch (err) {
      Sentry.captureException(err);
      setSentMessage(true);
      setTimeout(() => setSentMessage(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full bg-card border border-border rounded-xl shadow-lg p-8 text-card-foreground">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xl">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold">Sentry Verification Page</h1>
            <p className="text-xs text-muted-foreground">CloudSense Next.js 14 Integration</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Use the buttons below to test Sentry error tracking and verify events appear in your Sentry dashboard.
        </p>

        {sentMessage && (
          <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
            Event captured and sent to Sentry! Check your Sentry issues list.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={triggerCapturedException}
            className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition cursor-pointer"
          >
            Trigger Sentry.captureException()
          </button>

          <button
            type="button"
            onClick={triggerClientError}
            className="w-full py-2.5 px-4 rounded-lg bg-destructive text-destructive-foreground font-medium text-sm hover:opacity-90 transition cursor-pointer"
          >
            Throw Unhandled React Error
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
          <p><strong>Organization:</strong> yasar-pathan</p>
          <p><strong>Project:</strong> javascript-nextjs</p>
          <p><strong>Tunnel Route:</strong> /monitoring</p>
        </div>
      </div>
    </div>
  );
}
