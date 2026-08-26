import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// NCAA operates in Nigeria (WAT, UTC+1, no DST) -- format explicitly in
// that zone rather than relying on the server's or browser's ambient
// timezone, which is what produced times displayed in GMT/UTC instead.
const NIGERIA_TIMEZONE = 'Africa/Lagos'

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: NIGERIA_TIMEZONE,
  })
}

// Converts a stored UTC timestamp into the "YYYY-MM-DDTHH:mm" shape a
// <input type="datetime-local"> needs, expressed in WAT wall-clock time.
export function toWatDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NIGERIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))

  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

// Converts a "YYYY-MM-DDTHH:mm" value from a datetime-local input -- entered
// as WAT wall-clock time -- into a proper UTC ISO string for storage.
// WAT has no DST, so this is a fixed +1 hour offset.
export function fromWatDatetimeLocal(local: string): string {
  const [datePart, timePart] = local.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - 60 * 60 * 1000
  return new Date(utcMs).toISOString()
}