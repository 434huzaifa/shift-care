import { RRule } from "rrule";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Detect user's timezone
const userTimezone = dayjs.tz.guess();

export interface ShiftOccurrence {
  id: number;
  staffId: number;
  carerId: number;
  priceAmount: number;
  priceType: string;
  startDate: string;
  shift_start_time: string;
  shift_end_time: string;
  endDate: string;
  address: string;
  bonus: number | null;
  instruction: string | null;
  hours: number | null;
  occurrenceDate: string; // The specific date this occurrence happens
  isRecurring: boolean;
  staff?: {
    id: number;
    name: string;
    email: string;
  };
  carer?: {
    id: number;
    name: string;
    email: string;
  };
}

interface RawShift {
  id: number;
  staffId: number;
  carerId: number;
  priceAmount: number;
  priceType: string;
  startDate: string;
  shift_start_time: string;
  shift_end_time: string;
  endDate: string;
  address: string;
  bonus: number | null;
  instruction: string | null;
  hours: number | null;
  recurrenceRule: string | null;
  staff?: {
    id: number;
    name: string;
    email: string;
  };
  carer?: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Expands a single shift into multiple occurrences based on its RRule
 * @param shift - The shift to expand
 * @param startDate - Start of the date range to generate occurrences for
 * @param endDate - End of the date range to generate occurrences for
 * @returns Array of shift occurrences
 */
export function expandShiftOccurrences(
  shift: RawShift,
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs
): ShiftOccurrence[] {
  // If no recurrence rule, return single occurrence
  if (!shift.recurrenceRule) {
    // Use the startDate from the shift
    const shiftLocalDate = shift.startDate;
    
    // Check if the shift falls within our date range (using local dates)
    const rangeStart = startDate.format('YYYY-MM-DD');
    const rangeEnd = endDate.format('YYYY-MM-DD');
    
    if (shiftLocalDate >= rangeStart && shiftLocalDate <= rangeEnd) {
      return [{
        ...shift,
        occurrenceDate: shiftLocalDate,
        isRecurring: false
      }];
    }
    
    return [];
  }

  try {
    // Parse the RRule - use startDate as DTSTART
    // RRule.fromString expects full format with DTSTART
    const dtstartStr = dayjs(shift.startDate).format("YYYYMMDDTHHmmss");
    const fullRRule = `DTSTART:${dtstartStr}Z\n${shift.recurrenceRule}`;
    const rule = RRule.fromString(fullRRule);
    
    // Get ALL occurrences (not filtered by date range yet)
    // This ensures we generate all occurrences from the RRule
    const allOccurrences = rule.all();
    
    // Filter occurrences to only those within the date range
    const occurrences = allOccurrences.filter((date) => {
      const occDate = dayjs(date).tz(userTimezone);
      const occDateStr = occDate.format('YYYY-MM-DD');
      const rangeStart = startDate.format('YYYY-MM-DD');
      const rangeEnd = endDate.format('YYYY-MM-DD');
      return occDateStr >= rangeStart && occDateStr <= rangeEnd;
    });

    // The shift times are already in the correct format (no timezone conversion needed)
    // Create a shift occurrence for each date
    const expandedShifts = occurrences.map((occurrenceDate) => {
      const occurrenceDayjs = dayjs(occurrenceDate);
      const occurrenceDateStr = occurrenceDayjs.format('YYYY-MM-DD');

      return {
        ...shift,
        occurrenceDate: occurrenceDateStr,
        isRecurring: true
      };
    });

    return expandedShifts;
  } catch {
    // Return the original shift as fallback
    return [{
      ...shift,
      occurrenceDate: shift.startDate,
      isRecurring: false
    }];
  }
}

/**
 * Expands all shifts into individual occurrences and groups them by date
 * @param shifts - Array of raw shifts from the database
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Object with dates as keys and arrays of shift occurrences as values
 */
export function groupShiftsByDate(
  shifts: RawShift[],
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs
): Record<string, ShiftOccurrence[]> {
  const groupedShifts: Record<string, ShiftOccurrence[]> = {};

  shifts.forEach((shift) => {
    const occurrences = expandShiftOccurrences(shift, startDate, endDate);
    
    occurrences.forEach((occurrence) => {
      const dateKey = occurrence.occurrenceDate;
      
      if (!groupedShifts[dateKey]) {
        groupedShifts[dateKey] = [];
      }
      
      groupedShifts[dateKey].push(occurrence);
    });
  });

  // Sort shifts within each day by start time
  Object.keys(groupedShifts).forEach((dateKey) => {
    groupedShifts[dateKey].sort((a, b) => {
      // Compare shift_start_time strings directly (HH:mm format)
      return a.shift_start_time.localeCompare(b.shift_start_time);
    });
  });

  return groupedShifts;
}
