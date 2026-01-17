export interface EventTimeInput {
  event_time?: number;
  timestamp?: number | string | Date;
}

const MAX_SKEW_SECONDS = 60;

export function resolveEventTimeSeconds(input: EventTimeInput): number {
  const now = Math.floor(Date.now() / 1000);

  let value: number | undefined = input.event_time;

  if (!value && input.timestamp) {
    if (typeof input.timestamp === 'number') {
      value = Math.floor(input.timestamp / (input.timestamp > 1e12 ? 1000 : 1));
    } else {
      value = Math.floor(new Date(input.timestamp).getTime() / 1000);
    }
  }

  if (!value || Number.isNaN(value)) {
    return now;
  }

  if (value > now + MAX_SKEW_SECONDS) return now + MAX_SKEW_SECONDS;
  if (value < now - MAX_SKEW_SECONDS) return now - MAX_SKEW_SECONDS;

  return value;
}
