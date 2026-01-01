"use client";

import { useState, useEffect } from "react";
import { RRule, Frequency } from "rrule";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import dayjs from "dayjs";

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

export function RRuleGenerator({ value, onChange, startDate, endTime, onEndTimeChange }: RRuleGeneratorProps) {
  const [enabled, setEnabled] = useState(false);
  const [freq, setFreq] = useState<Frequency>(RRule.WEEKLY);
  const [interval, setInterval] = useState(1);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [byweekday, setByweekday] = useState<number[]>([]);
  const [endType, setEndType] = useState<"never" | "count">("never");
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse existing RRule value when component mounts or value changes
  useEffect(() => {
    if (value && !isInitialized) {
      try {
        const rule = RRule.fromString(value);
        const options = rule.origOptions;
        
        setEnabled(true);
        if (options.freq !== undefined) setFreq(options.freq);
        if (options.interval) setInterval(options.interval);
        if (options.count) {
          setCount(options.count);
          setEndType("count");
        }
        if (options.byweekday) {
          const weekdays = Array.isArray(options.byweekday) 
            ? options.byweekday.map((day: any) => typeof day === 'number' ? day : day.weekday)
            : [typeof options.byweekday === 'number' ? options.byweekday : options.byweekday.weekday];
          setByweekday(weekdays);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error parsing RRule:", error);
      }
    } else if (!value && isInitialized) {
      setIsInitialized(false);
    }
  }, [value, isInitialized]);

  // Generate RRule string
  useEffect(() => {
    if (!enabled) {
      onChange("");
      return;
    }

    try {
      const options: Record<string, unknown> = {
        freq,
        interval,
        dtstart: startDate.toDate(),
      };

      if (endType === "count" && count) {
        options.count = count;
        
        // Calculate the last occurrence date and update end_time
        if (onEndTimeChange) {
          const tempRule = new RRule({
            ...options,
            byweekday: byweekday.length > 0 && freq === RRule.WEEKLY ? byweekday : undefined,
          } as any);
          const occurrences = tempRule.all();
          if (occurrences.length > 0) {
            const lastOccurrence = occurrences[occurrences.length - 1];
            onEndTimeChange(dayjs(lastOccurrence).format("YYYY-MM-DDTHH:mm"));
          }
        }
      } else if (endTime) {
        // Use the end_time from the form as until date
        options.until = new Date(endTime);
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
  }, [enabled, freq, interval, count, byweekday, endType, startDate, endTime, onChange]);

  const handleWeekdayToggle = (day: number) => {
    setByweekday((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getReadableRule = () => {
    if (!enabled || !value) return "No recurrence";

    try {
      const fullRRule = `DTSTART:${startDate.format("YYYYMMDDTHHmmss")}Z\n${value}`;
      const rule = RRule.fromString(fullRRule);
      return rule.toText();
    } catch {
      return "Invalid rule";
    }
  };

  const getOccurrenceCount = () => {
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
  };

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
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <Select
                  value={freq.toString()}
                  onValueChange={(value) => setFreq(parseInt(value) as Frequency)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RRule.DAILY.toString()}>Day(s)</SelectItem>
                    <SelectItem value={RRule.WEEKLY.toString()}>Week(s)</SelectItem>
                    <SelectItem value={RRule.MONTHLY.toString()}>Month(s)</SelectItem>
                    <SelectItem value={RRule.YEARLY.toString()}>Year(s)</SelectItem>
                  </SelectContent>
                </Select>
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
            <Select value={endType} onValueChange={(value) => setEndType(value as typeof endType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="count">After number of occurrences</SelectItem>
              </SelectContent>
            </Select>
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
              <strong>Summary:</strong> {getReadableRule()}
            </p>
            {getOccurrenceCount() > 0 && (
              <p className="text-sm text-muted-foreground">
                <strong>Total occurrences:</strong> {getOccurrenceCount()}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
