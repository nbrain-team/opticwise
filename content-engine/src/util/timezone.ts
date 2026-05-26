import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const DENVER = 'America/Denver';

export function nowDenver(): dayjs.Dayjs {
  return dayjs().tz(DENVER);
}

export function isDenverWednesday8PM(): boolean {
  const now = nowDenver();
  return now.day() === 3 && now.hour() === 20;
}

export function nextFriday845Denver(fromDate: Date): string {
  const d = dayjs(fromDate).tz(DENVER);
  const daysUntilFriday = (5 - d.day() + 7) % 7 || 7;
  const friday = d.add(daysUntilFriday, 'day').hour(8).minute(45).second(0).millisecond(0);
  return friday.format();
}

export function nextMonday845Denver(fromDate: Date): string {
  const d = dayjs(fromDate).tz(DENVER);
  const daysUntilMonday = (1 - d.day() + 7) % 7 || 7;
  const monday = d.add(daysUntilMonday, 'day').hour(8).minute(45).second(0).millisecond(0);
  return monday.format();
}

export function denverDateString(date: Date): string {
  return dayjs(date).tz(DENVER).format('YYYY-MM-DD');
}

export function formatDenverTime(iso: string): string {
  return dayjs(iso).tz(DENVER).format('dddd YYYY-MM-DD HH:mm [America/Denver]');
}
