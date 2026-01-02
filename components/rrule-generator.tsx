"use client";

import { useState, useEffect, useMemo } from "react";
import { RRule, Frequency } from "rrule";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear";
import isLeapYear from "dayjs/plugin/isLeapYear";

dayjs.extend(dayOfYear);
dayjs.extend(isLeapYear);

interface RRuleGeneratorProps {
  value: string;
  onChange: (value: string) => void;
  startDate: dayjs.Dayjs;
  endTime: string;
  onEndTimeChange?: (endTime: string) => void;
}

const WEEKDAYS = [
  { label: "Mon", value: RRule.MO },
  { label: "Tue", value: RRule.TU },
  { label: "Wed", value: RRule.WE },
  { label: "Thu", value: RRule.TH },
  { label: "Fri", value: RRule.FR },
  { label: "Sat", value: RRule.SA },
  { label: "Sun", value: RRule.SU },
];

/**
 * Calculate maximum occurrences from start date to end of year
 */
function calculateMaxOccurrencesInYear(
  startDate: dayjs.Dayjs,
  freq: Frequency,
  interval: number,
  byweekday?: number[]
): number {
  const endOfYear = startDate.endOf('year');
  
  switch (freq) {
    case RRule.DAILY: {
      // Days remaining in the year (including start date)
      const daysInYear = startDate.isLeapYear() ? 366 : 365;
      const currentDayOfYear = startDate.dayOfYear();
      const daysRemaining = daysInYear - currentDayOfYear + 1;
      return Math.ceil(daysRemaining / interval);
    }
    
    case RRule.WEEKLY: {
      // Weeks remaining in the year
      const weeksRemaining = endOfYear.diff(startDate, 'week') + 1;
      const maxOccurrences = Math.ceil(weeksRemaining / interval);
      
      // If specific weekdays are selected, adjust the count
      if (byweekday && byweekday.length > 0 && byweekday.length < 7) {
        // Multiply by the number of selected weekdays per week
        return Math.ceil(maxOccurrences * byweekday.length);
      }
      
      return maxOccurrences;
    }
    
    case RRule.MONTHLY: {
      // Months remaining in the year (including current month)
      const monthsRemaining = 12 - startDate.month();
      return Math.ceil(monthsRemaining / interval);
    }
    
    case RRule.YEARLY: {
      // Only 1 occurrence this year
      return 1;
    }
    
    default:
      return 52; // Fallback
  }
}

export function RRuleGenerator({ value, onChange, startDate, endTime, onEndTimeChange }: RRuleGeneratorProps) {
  const [enabled, setEnabled] = useState(false);
  const [freq, setFreq] = useState<Frequency>(RRule.WEEKLY);
  const [interval, setInterval] = useState(1);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [byweekday, setByweekday] = useState<number[]>([]);
  const [endType, setEndType] = useState<"never" | "count">("never");
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate max interval based on what's left in the year
  const maxInterval = useMemo(() => {
    const endOfYear = startDate.endOf('year');
    
    switch (freq) {
      case RRule.DAILY: {
        const daysInYear = startDate.isLeapYear() ? 366 : 365;
        const currentDayOfYear = startDate.dayOfYear();
        return daysInYear - currentDayOfYear + 1;
      }
      case RRule.WEEKLY: {
        return endOfYear.diff(startDate, 'week') + 1;
      }
      case RRule.MONTHLY: {
        return 12 - startDate.month();
      }
      case RRule.YEARLY: {
        return 1;
      }
      default:
        return 52;
    }
  }, [startDate, freq]);

  // Parse existing RRule value when component mounts or value changes
  useEffect(() => {
    if (value && !isInitialized) {
      try {
        const rule = RRule.fromString(value);
        const options = rule.origOptions;
        
        // Use queueMicrotask to schedule state updates after the effect
        queueMicrotask(() => {
          setEnabled(true);
          if (options.freq !== undefined) setFreq(options.freq);
          if (options.interval) setInterval(options.interval);
          if (options.count) {
            setCount(options.count);
            setEndType("count");
          }
          if (options.byweekday) {
            const weekdays = Array.isArray(options.byweekday) 
              ? options.byweekday.map((day: any) => {
                  if (typeof day === 'number') return day;
                  if (typeof day === 'object' && 'weekday' in day) return day.weekday;
                  return day;
                })
              : [typeof options.byweekday === 'number' 
                  ? options.byweekday 
                  : typeof options.byweekday === 'object' && 'weekday' in options.byweekday
                    ? options.byweekday.weekday
                    : options.byweekday];
            setByweekday(weekdays);
          }
          setIsInitialized(true);
        });
      } catch (error) {
        console.error("Error parsing RRule:", error);
      }
    } else if (!value && isInitialized) {
      queueMicrotask(() => setIsInitialized(false));
    }
  }, [value, isInitialized]);

  // Adjust interval when frequency changes if it exceeds the new max
  useEffect(() => {
    if (interval > maxInterval) {
      queueMicrotask(() => setInterval(maxInterval));
    }
  }, [freq, maxInterval, interval]);

  // Generate RRule string
  useEffect(() => {
    if (!enabled) {
      onChange("");
      return;
    }

    // Use a small timeout to debounce rapid changes
    const timeoutId = setTimeout(() => {
      try {
        const options: Record<string, unknown> = {
          freq,
          interval,
          dtstart: startDate.toDate(),
        };

        // Determine the count
        let finalCount: number;
        
        if (endType === "count") {
          // User wants to specify custom count
          if (!count) {
            // Don't generate RRule until user enters a count
            onChange("");
            return;
          }
          finalCount = count;
        } else {
          // endType === "never" - calculate max occurrences in year
          finalCount = calculateMaxOccurrencesInYear(startDate, freq, interval, byweekday);
        }
        
        options.count = finalCount;
        
        // Calculate the last occurrence date and update end_time
        if (onEndTimeChange) {
          const tempRule = new RRule({
            ...options,
            byweekday: byweekday.length > 0 && freq === RRule.WEEKLY ? byweekday : undefined,
          } as any);
          const occurrences = tempRule.all();
          if (occurrences.length > 0) {
            const lastOccurrence = occurrences[occurrences.length - 1];
            onEndTimeChange(dayjs(lastOccurrence).format("YYYY-MM-DD"));
          }
        }

        if (byweekday.length > 0 && freq === RRule.WEEKLY) {
          options.byweekday = byweekday;
        }

        const rule = new RRule(options);
        const rruleString = rule.toString().split("\n")[1]; // Get only RRULE part
        onChange(rruleString);
      } catch (error) {
        console.error("Error generating RRule:", error);
        onChange("");
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [enabled, freq, interval, count, byweekday, endType, startDate, endTime, onChange, onEndTimeChange]);

  const handleWeekdayToggle = (day: number) => {
    setByweekday((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const readableRule = useMemo(() => {
    if (!enabled || !value) return "No recurrence";

    try {
      const fullRRule = `DTSTART:${startDate.format("YYYYMMDDTHHmmss")}Z\n${value}`;
      const rule = RRule.fromString(fullRRule);
      return rule.toText();
    } catch {
      return "Invalid rule";
    }
  }, [enabled, value, startDate]);

  const occurrenceCount = useMemo(() => {
    if (!enabled || !value) return 0;

    try {
      const fullRRule = `DTSTART:${startDate.format("YYYYMMDDTHHmmss")}Z\n${value}`;
      const rule = RRule.fromString(fullRRule);
      
      // Get all occurrences (limited to prevent infinite loops)
      const occurrences = rule.all((date, i) => i < 1000); // Max 1000 occurrences for safety
      return occurrences.length;
    } catch {
      return 0;
    }
  }, [enabled, value, startDate]);

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="recurrence-enabled"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked as boolean)}
        />
        <Label htmlFor="recurrence-enabled" className="font-semibold">
          Repeat this shift
        </Label>
      </div>

      {enabled && (
        <>
          {/* Frequency and Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Repeat every</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max={maxInterval}
                  value={interval}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setInterval(Math.min(val, maxInterval));
                  }}
                  className="w-20"
                />
                <Select
                  options={[
                    { value: RRule.DAILY, label: "Day(s)" },
                    { value: RRule.WEEKLY, label: "Week(s)" },
                    { value: RRule.MONTHLY, label: "Month(s)" },
                    { value: RRule.YEARLY, label: "Year(s)" },
                  ]}
                  value={{ value: freq, label: freq === RRule.DAILY ? "Day(s)" : freq === RRule.WEEKLY ? "Week(s)" : freq === RRule.MONTHLY ? "Month(s)" : "Year(s)" }}
                  onChange={(option) => option && setFreq(option.value as Frequency)}
                  classNamePrefix="select"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Weekdays for Weekly frequency */}
          {freq === RRule.WEEKLY && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map((day) => (
                  <Badge
                    key={day.value.weekday}
                    variant={byweekday.includes(day.value.weekday) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleWeekdayToggle(day.value.weekday)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* End Type */}
          <div className="space-y-2">
            <Label>Ends</Label>
            <Select
              options={[
                { value: "never", label: "Never (Until end of year)" },
                { value: "count", label: "After number of occurrences" },
              ]}
              value={{ value: endType, label: endType === "never" ? "Never (Until end of year)" : "After number of occurrences" }}
              onChange={(option) => option && setEndType(option.value as typeof endType)}
              classNamePrefix="select"
            />
            {endType === "never" && (
              <p className="text-xs text-muted-foreground">
                Will repeat until the end of {startDate.year()}
              </p>
            )}
          </div>

          {/* Count Input */}
          {endType === "count" && (
            <div className="space-y-2">
              <Label>Number of occurrences</Label>
              <Input
                type="number"
                min="1"
                value={count || ""}
                onChange={(e) => setCount(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 10"
              />
            </div>
          )}

          {/* Readable Summary */}
          <div className="p-3 bg-muted rounded-md space-y-1">
            <p className="text-sm text-muted-foreground">
              <strong>Summary:</strong> {readableRule}
            </p>
            {occurrenceCount > 0 && (
              <p className="text-sm text-muted-foreground">
                <strong>Total occurrences:</strong> {occurrenceCount}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
