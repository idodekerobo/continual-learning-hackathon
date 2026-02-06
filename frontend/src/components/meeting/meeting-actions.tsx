"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { triggerPoll, runMeeting } from "@/lib/api";

export function TriggerPollButton() {
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    try {
      const res = await triggerPoll();
      setMessage(`New: ${res.new_meetings}, processed: ${res.processed_meetings}`);
    } catch (err) {
      setMessage("Trigger failed. Check backend.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="primary" onClick={handleClick} disabled={pending}>
        {pending ? "Running..." : "Simulate booking"}
      </Button>
      {message ? (
        <div className="text-[11px] text-[var(--muted)]">{message}</div>
      ) : null}
    </div>
  );
}

export function RunMeetingButton({ meetingId }: { meetingId: number }) {
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    try {
      await runMeeting(meetingId);
      setMessage("Pipeline triggered.");
    } catch (err) {
      setMessage("Run failed. Check backend.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="primary" onClick={handleClick} disabled={pending}>
        {pending ? "Running..." : "Run now"}
      </Button>
      {message ? (
        <div className="text-[11px] text-[var(--muted)]">{message}</div>
      ) : null}
    </div>
  );
}
