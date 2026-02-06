import type { MeetingStatus } from "@/lib/types";

import { Chip } from "@/components/ui/chip";

export function StatusChip({ status }: { status: MeetingStatus }) {
  switch (status) {
    case "New":
      return <Chip tone="new">New</Chip>;
    case "Enriched":
      return <Chip tone="enriched">Enriched</Chip>;
    case "Drafted":
      return <Chip tone="drafted">Drafted</Chip>;
    case "Feedback Given":
      return <Chip tone="feedback">Feedback Given</Chip>;
    default:
      return <Chip tone="ink">{status}</Chip>;
  }
}

