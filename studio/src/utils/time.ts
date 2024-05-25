import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  format,
} from "date-fns";
import { enUS } from "date-fns/locale";
export const DATE_FORMAT = "yyyy/MM/dd";
export const TIME_FORMAT_WITH_SECONDS = "HH:mm:ss";
export const DATE_TIME_FORMAT = "yyyy/MM/dd HH:mm:ss";
export const DATE_TIME_FORMAT_WITH_MS = "yyyy/MM/dd HH:mm:ss.SSS";
export const DATE_FORMAT_MONTH_DAY_YEAR = "MMM d, yyyy";
export const TIME_FORMAT = "HH:mm";
export const DATETIME_MED_WITH_SECONDS = "MMM d, yyyy, HH:mm:ss";
export const DATETIME_MED = "MMM d, yyyy, HH:mm";

export function formatDate(date: string | Date, formatString: string) {
  return format(new Date(date), formatString, {
    locale: enUS,
  });
}

export function convertUTC(date: string | Date, formatString: string) {
  try {
    const dateWithTimezone = new Date(date);
    const timezoneOffsetMs = dateWithTimezone.getTimezoneOffset() * 60 * 1000;
    const dateWithoutTimezone = new Date(
      dateWithTimezone.getTime() + timezoneOffsetMs
    );
    return format(new Date(dateWithoutTimezone), formatString, {
      locale: enUS,
    });
  } catch (error) {
    console.error("Error in formatDate", date);
  }
  return "";
}

export function getRelativeTime(isoDate: string): string {
  const now = new Date();
  const past = new Date(isoDate);
  const secondsPast = Math.floor((now.getTime() - past.getTime()) / 1000);

  const units = [
    { name: "y", value: 60 * 60 * 24 * 365 },
    { name: "mo", value: 60 * 60 * 24 * 30 },
    { name: "w", value: 60 * 60 * 24 * 7 },
    { name: "d", value: 60 * 60 * 24 },
    { name: "h", value: 60 * 60 },
    { name: "m", value: 60 },
    { name: "s", value: 1 },
  ];

  for (const unit of units) {
    const count = Math.floor(secondsPast / unit.value);
    if (count >= 1) {
      return `${count}${unit.name} ago`;
    }
  }

  return "just now";
}

export function secondsToRelativeTime(seconds: number): string {
  const units = [
    { name: "y", value: 60 * 60 * 24 * 365 },
    { name: "mo", value: 60 * 60 * 24 * 30 },
    { name: "w", value: 60 * 60 * 24 * 7 },
    { name: "d", value: 60 * 60 * 24 },
    { name: "h", value: 60 * 60 },
    { name: "m", value: 60 },
    { name: "s", value: 1 },
  ];

  let timeString = "";

  for (const unit of units) {
    const count = Math.floor(seconds / unit.value);
    if (count >= 1) {
      timeString += `${count}${unit.name} `;
      seconds -= count * unit.value;
    }
  }

  return timeString.trim();
}

export function convertDateToMilliseconds(dateString: string): number {
  return new Date(dateString).getTime();
}
export function calculateRecommendedBuckets(start: Date, end: Date): number {
  const years = differenceInYears(end, start);
  const months = differenceInMonths(end, start);
  const days = differenceInDays(end, start);

  const totalMonths = years * 12 + months;
  const totalDays = months * 30 + days;

  if (years && totalMonths < 30) {
    return Math.floor(totalMonths);
  }

  if (months && totalDays < 30) {
    return Math.floor(totalDays);
  }

  if (years > 0) {
    return years === 1 ? 12 : Math.floor(years + 1);
  }

  if (months && months > 0) {
    return months === 1 && !days ? 30 : Math.floor(months + 1);
  }

  if (days && days > 0) {
    return days > 1 ? Math.floor(days + 1) : 24;
  }

  return 24;
}
export function formatTime(timeInMilliseconds: number) {
  if (timeInMilliseconds === 0) return undefined;
  if (timeInMilliseconds < 1000) {
    // If the time is less than 1 second, format it in milliseconds
    return `${timeInMilliseconds.toFixed()} ms`;
  } else {
    // If the time is 1 second or more, format it in seconds with one decimal place
    const seconds = (timeInMilliseconds / 1000).toFixed(1);
    return `${seconds} s`;
  }
}
