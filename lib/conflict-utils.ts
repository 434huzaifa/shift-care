import dayjs from "dayjs";
import { RRule } from "rrule";

interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * Check if two time ranges overlap on the same date
 */
export function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // Must be on the same date
  if (slot1.date !== slot2.date) {
    return false;
  }

  // Parse times to minutes since midnight for easier comparison
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1 = parseTime(slot1.startTime);
  const end1 = parseTime(slot1.endTime);
  const start2 = parseTime(slot2.startTime);
  const end2 = parseTime(slot2.endTime);

  // Two time ranges overlap if:
  // start1 < end2 AND end1 > start2
  return start1 < end2 && end1 > start2;
}

/**
 * Generate all time slots for a shift (including recurring occurrences)
 */
export function generateShiftTimeSlots(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  recurrenceRule: string | null
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  if (!recurrenceRule) {
    // Non-recurring shift - single occurrence
    slots.push({
      date: startDate,
      startTime,
      endTime,
    });
    return slots;
  }

  try {
    // Parse RRule and generate occurrences
    // RRule.fromString expects full format with DTSTART
    const dtstartStr = dayjs(startDate).format("YYYYMMDDTHHmmss");
    const fullRRule = `DTSTART:${dtstartStr}Z\n${recurrenceRule}`;
    const rule = RRule.fromString(fullRRule);
    const allOccurrences = rule.all();

    // Create a time slot for each occurrence
    allOccurrences.forEach((occurrenceDate) => {
      const dateStr = dayjs(occurrenceDate).format('YYYY-MM-DD');
      
      // Filter by endDate if provided
      if (endDate && dateStr > endDate) {
        return;
      }

      slots.push({
        date: dateStr,
        startTime,
        endTime,
      });
    });
  } catch (error) {
    console.error("Error generating time slots from RRule:", error);
    // Fallback to single occurrence
    slots.push({
      date: startDate,
      startTime,
      endTime,
    });
  }

  return slots;
}

export interface ConflictInfo {
  date: string;
  time: string;
  carerName: string;
  conflictingShiftId: number;
}

/**
 * Check if a new shift conflicts with existing shifts for the same staff
 */
export function checkShiftConflicts(
  newShift: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    recurrenceRule: string | null;
    staffId: number;
  },
  existingShifts: Array<{
    id: number;
    startDate: string;
    endDate: string;
    shift_start_time: string;
    shift_end_time: string;
    recurrenceRule: string | null;
    staffId: number;
    carer: {
      name: string;
    };
  }>,
  excludeShiftId?: number
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  // Generate time slots for the new shift
  const newSlots = generateShiftTimeSlots(
    newShift.startDate,
    newShift.endDate,
    newShift.startTime,
    newShift.endTime,
    newShift.recurrenceRule
  );

  // Check against each existing shift for the same staff
  for (const existingShift of existingShifts) {
    // Skip if this is the shift being edited
    if (excludeShiftId && existingShift.id === excludeShiftId) {
      continue;
    }

    // Only check shifts for the same staff
    if (existingShift.staffId !== newShift.staffId) {
      continue;
    }

    // Generate time slots for the existing shift
    const existingSlots = generateShiftTimeSlots(
      existingShift.startDate,
      existingShift.endDate,
      existingShift.shift_start_time,
      existingShift.shift_end_time,
      existingShift.recurrenceRule
    );

    // Check for overlaps between new and existing slots
    for (const newSlot of newSlots) {
      for (const existingSlot of existingSlots) {
        if (doTimeSlotsOverlap(newSlot, existingSlot)) {
          conflicts.push({
            date: newSlot.date,
            time: `${newSlot.startTime} - ${newSlot.endTime}`,
            carerName: existingShift.carer.name,
            conflictingShiftId: existingShift.id,
          });
        }
      }
    }
  }

  return conflicts;
}
