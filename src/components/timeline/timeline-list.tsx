"use client";

import { TimelineEventCard } from "@/components/timeline/timeline-event-card";
import type { TimelineEvent } from "@/server/types/domain";

export function TimelineList({ events, compact = false, onViewEvidence, onViewEncounter }: {
  events: TimelineEvent[];
  compact?: boolean;
  onViewEvidence?: (event: TimelineEvent) => void;
  onViewEncounter?: (event: TimelineEvent) => void;
}) {
  return (
    <div>
      {events.map((event) => <TimelineEventCard key={event.id} event={event} compact={compact} onViewEvidence={onViewEvidence} onViewEncounter={onViewEncounter} />)}
    </div>
  );
}
