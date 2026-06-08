export function formatRelativeTime(
  iso: string | null | undefined,
  nowIso: string,
): string {
  if (!iso || !nowIso) return '';

  const target = Date.parse(iso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(target) || Number.isNaN(now)) return '';

  const deltaMs = now - target;
  if (deltaMs < 0) return 'just now';

  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  return `on ${iso.slice(0, 10)}`;
}
