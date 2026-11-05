import type { Overview } from '../domain/Conversation.js';
import { textPrefix } from '../text.js';

/** Only the public UI projection is bounded; original arguments and evidence stay in Pi. */
export function sanitizeOverview(value: Overview): Overview {
  const clean = (text: string, max: number) =>
    textPrefix(
      text
        .replace(
          /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,
          ' ',
        )
        .trim(),
      max,
    );
  const input = value.input
    .slice(0, 8)
    .map((item) => ({
      label: clean(item.label, 32),
      value: clean(item.value, 256),
    }))
    .filter((item) => item.label && item.value);
  const summary = value.summary ? clean(value.summary, 320) : '';
  const note = value.note ? clean(value.note, 400) : '';
  const items = value.items
    ?.slice(0, 8)
    .map((item) => clean(item, 200))
    .filter(Boolean);
  return {
    input,
    ...(summary ? { summary } : {}),
    ...(note ? { note } : {}),
    ...(items?.length ? { items } : {}),
  };
}
