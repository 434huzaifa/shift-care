import { RRule } from "rrule";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Detect user's timezone
const userTimezone = dayjs.tz.guess();
console.log('[shift-utils] Detected timezone:', userTimezone);

export interface ShiftOccurrence {
  id: number;
  staffId: number;
  carerId: number;
  priceAmount: number;
  priceType: string;
  start_time: string;
  end_time: string;
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
  start_time: string;
  end_time: string;
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
  console.log(`[expandShiftOccurrences] Processing shift #${shift.id}`);
  console.log(`[expandShiftOccurrences] Has RRule: ${!!shift.recurrenceRule}`);
  
  // If no recurrence rule, return single occurrence
  if (!shift.recurrenceRule) {
    // Parse UTC time and convert to user's local timezone
    const shiftStart = dayjs(shift.start_time).tz(userTimezone);
    const shiftLocalDate = shiftStart.format('YYYY-MM-DD');
    
    console.log(`[expandShiftOccurrences] Non-recurring shift`);
    console.log(`[expandShiftOccurrences] DB time (UTC): ${shift.start_time}`);
    console.log(`[expandShiftOccurrences] Local time (${userTimezone}): ${shiftStart.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`[expandShiftOccurrences] Local date: ${shiftLocalDate}`);
    
    // Check if the shift falls within our date range (using local dates)
    const rangeStart = startDate.format('YYYY-MM-DD');
    const rangeEnd = endDate.format('YYYY-MM-DD');
    
    console.log(`[expandShiftOccurrences] Checking if ${shiftLocalDate} is between ${rangeStart} and ${rangeEnd}`);
    
    if (shiftLocalDate >= rangeStart && shiftLocalDate <= rangeEnd) {
      console.log(`[expandShiftOccurrences] ✓ Shift included, occurrenceDate: ${shiftLocalDate}`);
      return [{
        ...shift,
        occurrenceDate: shiftLocalDate,
        isRecurring: false
      }];
    }
    
    console.log(`[expandShiftOccurrences] ✗ Shift outside date range, skipping`);
    return [];
  }

  try {
    // Parse the RRule
    const rule = RRule.fromString(shift.recurrenceRule);
    console.log(`[expandShiftOccurrences] Parsed RRule successfully`);
    
    // Get all occurrences within the date range
    const occurrences = rule.between(
      startDate.toDate(),
      endDate.toDate(),
      true // inclusive
    );
    
    console.log(`[expandShiftOccurrences] Found ${occurrences.length} occurrences`);

    // Get the original time components from the shift (in user's timezone)
    const originalStart = dayjs(shift.start_time).tz(userTimezone);
    const originalEnd = dayjs(shift.end_time).tz(userTimezone);
    const duration = originalEnd.diff(originalStart, 'minute');
    
    console.log(`[expandShiftOccurrences] Original time: ${originalStart.format('HH:mm')} - ${originalEnd.format('HH:mm')}`);
    console.log(`[expandShiftOccurrences] Duration: ${duration} minutes`);

    // Create a shift occurrence for each date
    const expandedShifts = occurrences.map((occurrenceDate, index) => {
      const occurrenceDayjs = dayjs(occurrenceDate).tz(userTimezone);
      
      // Combine occurrence date with original time (in user's timezone)
      const newStartTime = occurrenceDayjs
        .hour(originalStart.hour())
        .minute(originalStart.minute())
        .second(0);
      
      const newEndTime = newStartTime.add(duration, 'minute');
      const occurrenceDateStr = occurrenceDayjs.format('YYYY-MM-DD');
      
      if (index === 0) {
        console.log(`[expandShiftOccurrences] Sample occurrence #1:`);
        console.log(`[expandShiftOccurrences]   Date: ${occurrenceDateStr}`);
        console.log(`[expandShiftOccurrences]   Time: ${newStartTime.format('HH:mm')} - ${newEndTime.format('HH:mm')}`);
      }

      return {
        ...shift,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        occurrenceDate: occurrenceDateStr,
        isRecurring: true
      };
    });

    return expandedShifts;
  } catch (error) {
    console.error(`[expandShiftOccurrences] Error parsing RRule for shift #${shift.id}:`, error);
    // Return the original shift as fallback
    const shiftStart = dayjs(shift.start_time).tz(userTimezone);
    const shiftLocalDate = shiftStart.format('YYYY-MM-DD');
    return [{
      ...shift,
      occurrenceDate: shiftLocalDate,
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
  console.log(`[groupShiftsByDate] Processing ${shifts.length} shifts`);
  console.log(`[groupShiftsByDate] Date range: ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);
  
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
      const timeA = dayjs(a.start_time);
      const timeB = dayjs(b.start_time);
      return timeA.isBefore(timeB) ? -1 : 1;
    });
    
    const sampleShift = groupedShifts[dateKey][0];
    console.log(`[groupShiftsByDate] Date ${dateKey}: ${groupedShifts[dateKey].length} shift(s)`);
    if (sampleShift) {
      console.log(`[groupShiftsByDate]   Sample - DB: ${sampleShift.start_time}, Local (${userTimezone}): ${dayjs(sampleShift.start_time).tz(userTimezone).format('YYYY-MM-DD HH:mm:ss')}`);
    }
  });

  console.log(`[groupShiftsByDate] Final grouped dates:`, Object.keys(groupedShifts).sort());

  return groupedShifts;
}
