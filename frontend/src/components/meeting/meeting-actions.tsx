"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { runMeeting } from "@/lib/api";

const MOCK_CALENDAR_EVENTS = [
  {
    action: "GOOGLECALENDAR_CREATE_EVENT",
    input: {
      calendarId: "primary",
      summary: "Product Strategy Sync",
      description: "Quarterly roadmap review with the engineering team.",
      start: {
        dateTime: "2024-10-25T14:00:00Z",
        timeZone: "UTC",
      },
      end: {
        dateTime: "2024-10-25T15:00:00Z",
        timeZone: "UTC",
      },
      attendees: [{ email: "engineer@company.com" }, { email: "pm@company.com" }],
      location: "Google Meet",
    },
  },
  {
    action: "GOOGLECALENDAR_CREATE_EVENT",
    input: {
      calendarId: "primary",
      summary: "Customer Onboarding",
      description: "Kickoff call for new enterprise customer.",
      start: {
        dateTime: "2024-10-26T16:30:00Z",
        timeZone: "UTC",
      },
      end: {
        dateTime: "2024-10-26T17:15:00Z",
        timeZone: "UTC",
      },
      attendees: [{ email: "csm@company.com" }, { email: "customer@enterprise.com" }],
      location: "Google Meet",
    },
  },
  {
    action: "GOOGLECALENDAR_CREATE_EVENT",
    input: {
      calendarId: "primary",
      summary: "Design Review",
      description: "Walkthrough of new onboarding flow.",
      start: {
        dateTime: "2024-10-27T09:00:00Z",
        timeZone: "UTC",
      },
      end: {
        dateTime: "2024-10-27T09:45:00Z",
        timeZone: "UTC",
      },
      attendees: [{ email: "design@company.com" }, { email: "frontend@company.com" }],
      location: "Google Meet",
    },
  },
];

export function TriggerPollButton() {
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    try {
      const res = {
        new_meetings: MOCK_CALENDAR_EVENTS.length,
        processed_meetings: MOCK_CALENDAR_EVENTS.length,
      };
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
