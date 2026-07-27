/* Live "open / closed" state.

   Everything is evaluated in the restaurant's own timezone, not the visitor's:
   a diner checking from Germany should still see Canarian opening times. */

const CLOSING_SOON_MIN = 30;
const OPENING_SOON_MIN = 60;

/** Current weekday (0=Sun) and minutes-since-midnight in `tz`. */
export function nowIn(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = Number(get('hour')) % 24;

  return { day: days[get('weekday')] ?? 0, minutes: hour * 60 + Number(get('minute')) };
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const pad = (n) => String(n).padStart(2, '0');
export const fromMinutes = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

function rangesFor(hours, day) {
  const raw = hours?.weekly?.[String(day)] ?? [];
  return raw
    .map(([from, to]) => ({ from: toMinutes(from), to: toMinutes(to) }))
    .filter((r) => r.from != null && r.to != null && r.to > r.from)
    .sort((a, b) => a.from - b.from);
}

/**
 * @returns {{state:'open'|'soon'|'closing'|'closed', closesAt?:number,
 *            opensAt?:number, opensDay?:number, minutes?:number}}
 */
export function status(hours, tz) {
  const { day, minutes } = nowIn(tz);

  for (const range of rangesFor(hours, day)) {
    if (minutes >= range.from && minutes < range.to) {
      const left = range.to - minutes;
      return left <= CLOSING_SOON_MIN
        ? { state: 'closing', closesAt: range.to, minutes: left }
        : { state: 'open', closesAt: range.to };
    }
  }

  /* Not open right now — find the next opening within the coming week. */
  for (let ahead = 0; ahead < 8; ahead++) {
    const probe = (day + ahead) % 7;
    for (const range of rangesFor(hours, probe)) {
      if (ahead === 0 && range.from <= minutes) continue;
      const wait = ahead * 1440 + range.from - minutes;
      return wait <= OPENING_SOON_MIN
        ? { state: 'soon', opensAt: range.from, opensDay: probe, minutes: wait }
        : { state: 'closed', opensAt: range.from, opensDay: probe, minutes: wait, today: ahead === 0 };
    }
  }

  return { state: 'closed' };
}

/** Rows for the footer table: [{day, label, ranges, isToday}] */
export function weekRows(hours, tz, weekdayNames) {
  const { day: today } = nowIn(tz);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((day) => ({
    day,
    label: weekdayNames[day],
    ranges: rangesFor(hours, day).map((r) => `${fromMinutes(r.from)}–${fromMinutes(r.to)}`),
    isToday: day === today
  }));
}
