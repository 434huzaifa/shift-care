"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/ui/field-error";
import { getSelectedValue, formatSelectOption } from "@/lib/form-utils";
import { DATE_PICKER_INPUT_CLASS } from "@/lib/constants";
import dayjs from "dayjs";
import { RRuleGenerator } from "./rrule-generator";
import { RRule } from "rrule";
import DatePicker, { ReactDatePickerCustomHeaderProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth } from "date-fns";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const range = (start: number, end: number, step: number) => {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
};

const years = range(1990, getYear(new Date()) + 1, 1);

interface CustomHeaderProps extends ReactDatePickerCustomHeaderProps {
  selectDate?: (date: Date) => void;
}

const CustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  selectDate,
}: CustomHeaderProps) => {
  const handleTodayClick = () => {
    const today = new Date();
    if (selectDate) {
      selectDate(today);
    }
    changeYear(getYear(today));
    changeMonth(getMonth(today));
  };

  return (
    <div
      style={{
        margin: 10,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          className="px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-50"
        >
          {"<"}
        </button>
        <select
          value={getYear(date)}
          onChange={({ target: { value } }) => changeYear(+value)}
          className="px-2 py-1 border rounded"
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={MONTHS[getMonth(date)]}
          onChange={({ target: { value } }) =>
            changeMonth(MONTHS.indexOf(value as (typeof MONTHS)[number]))
          }
          className="px-2 py-1 border rounded"
        >
          {MONTHS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          className="px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-50"
        >
          {">"}
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={handleTodayClick}
          className="px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
        >
          Today
        </button>
      </div>
    </div>
  );
};

const shiftSchema = z.object({
  staffId: z.number().min(1, "Staff is required"),
  carerId: z.number().min(1, "Carer is required"),
  priceAmount: z.number().min(0, "Price must be positive"),
  priceType: z.enum(["WEEKLY", "HOURLY", "DAILY", "MONTHLY"]),
  startDate: z.string().min(1, "Start date is required"),
  shift_start_time: z.string().min(1, "Shift start time is required"),
  shift_end_time: z.string().min(1, "Shift end time is required"),
  address: z.string().min(1, "Address is required"),
  bonus: z.number().optional(),
  instruction: z.string().optional(),
  recurrenceRule: z.string().optional(),
}).refine((data) => {
  const start = dayjs(`${data.startDate} ${data.shift_start_time}`);
  const end = dayjs(`${data.startDate} ${data.shift_end_time}`);
  return end.isAfter(start);
}, {
  message: "End time must be after start time",
  path: ["shift_end_time"],
}).refine((data) => {
  const start = dayjs(`${data.startDate} ${data.shift_start_time}`);
  const end = dayjs(`${data.startDate} ${data.shift_end_time}`);
  const diffHours = end.diff(start, 'hour', true);
  return diffHours >= 1;
}, {
  message: "Shift duration must be at least 1 hour",
  path: ["shift_end_time"],
});

type ShiftFormData = z.infer<typeof shiftSchema>;

interface Staff {
  id: number;
  name: string;
  email: string;
}

interface Carer {
  id: number;
  name: string;
  email: string;
}

interface ShiftData {
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
  recurrenceRule: string | null;
  occurrences: number | null;
  summary: string | null;
}

interface CreateShiftFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: dayjs.Dayjs;
  shiftData?: ShiftData | null;
  onSuccess?: () => void;
}

export function CreateShiftForm({
  open,
  onOpenChange,
  selectedDate,
  shiftData,
  onSuccess,
}: CreateShiftFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [carerList, setCarerList] = useState<Carer[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingCarer, setIsLoadingCarer] = useState(false);
  const [rrule, setRrule] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isEditMode = !!shiftData;

  const form = useForm({
    defaultValues: {
      staffId: shiftData?.staffId || (undefined as number | undefined),
      carerId: shiftData?.carerId || (undefined as number | undefined),
      priceAmount: shiftData?.priceAmount || 0,
      priceType: (shiftData?.priceType || "HOURLY") as ShiftFormData["priceType"],
      startDate: shiftData?.startDate || selectedDate.format("YYYY-MM-DD"),
      shift_start_time: shiftData?.shift_start_time || "09:00",
      shift_end_time: shiftData?.shift_end_time || "10:00",
      address: shiftData?.address || "",
      bonus: shiftData?.bonus || (0 as number | undefined),
      instruction: shiftData?.instruction || "",
      recurrenceRule: shiftData?.recurrenceRule || "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        // Validate time constraints
        const start = dayjs(`${value.startDate} ${value.shift_start_time}`);
        const end = dayjs(`${value.startDate} ${value.shift_end_time}`);
        
        if (!end.isAfter(start)) {
          showError("Invalid Time", "End time must be after start time");
          setIsSubmitting(false);
          return;
        }
        
        const diffHours = end.diff(start, 'hour', true);
        if (diffHours < 1) {
          showError("Invalid Duration", "Shift duration must be at least 1 hour");
          setIsSubmitting(false);
          return;
        }
        
        // Calculate occurrences, summary, and endDate if rrule exists
        let occurrences: number | null = null;
        let summary: string | null = null;
        let calculatedEndDate = value.startDate; // Default to startDate if not repeating
        
        if (rrule) {
          try {
            const rule = RRule.fromString(rrule);
            const options = rule.origOptions;
            occurrences = options.count ?? null;
            summary = rule.toText() ?? null;
            
            // Calculate endDate from last occurrence
            const allOccurrences = rule.all();
            if (allOccurrences.length > 0) {
              const lastOccurrence = allOccurrences[allOccurrences.length - 1];
              calculatedEndDate = dayjs(lastOccurrence).format('YYYY-MM-DD');
            }
          } catch (e) {
            console.error("Error parsing rrule:", e);
          }
        }

        // Check for conflicts before creating/updating
        try {
          const conflictCheckResponse = await fetch('/api/shift/check-conflict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              staffId: value.staffId,
              startDate: value.startDate,
              endDate: calculatedEndDate,
              shift_start_time: value.shift_start_time,
              shift_end_time: value.shift_end_time,
              recurrenceRule: rrule || null,
              excludeShiftId: isEditMode ? shiftData.id : null,
            }),
          });

          if (conflictCheckResponse.ok) {
            const conflictData = await conflictCheckResponse.json();
            
            if (conflictData.hasConflicts) {
              const conflicts = conflictData.conflicts;
              const totalConflicts = conflictData.totalConflicts;
              
              // Format conflict message
              let conflictMessage = '';
              if (conflicts.length === 1) {
                const conflict = conflicts[0];
                conflictMessage = `Conflicts with ${conflict.carerName} on ${dayjs(conflict.date).format('MMM D, YYYY')} at ${conflict.time}`;
              } else {
                const firstConflict = conflicts[0];
                conflictMessage = `${totalConflicts} conflict(s) found. First: ${firstConflict.carerName} on ${dayjs(firstConflict.date).format('MMM D, YYYY')} at ${firstConflict.time}`;
              }
              
              showError('Schedule Conflict Detected', conflictMessage);
              setIsSubmitting(false);
              return;
            }
          }
        } catch (conflictError) {
          console.error('Error checking conflicts:', conflictError);
          // Continue anyway if conflict check fails
        }

        // Calculate hours from shift times
        const hours = end.diff(start, 'hour', true);

        const payload = {
          ...value,
          endDate: calculatedEndDate,
          hours,
          recurrenceRule: rrule || null,
          occurrences,
          summary,
        };

        const url = isEditMode ? `/api/shift/${shiftData.id}` : "/api/shift";
        const method = isEditMode ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || `Failed to ${isEditMode ? "update" : "create"} shift`;
          throw new Error(errorMessage);
        }

        showSuccess(
          `Shift ${isEditMode ? "updated" : "created"} successfully!`,
          `The shift has been ${isEditMode ? "updated" : "added to the schedule"}`
        );
        onOpenChange(false);
        onSuccess?.();
        form.reset();
        setRrule("");
      } catch (error: any) {
        showError(
          `Failed to ${isEditMode ? "update" : "create"} shift`,
          error.message || "Please try again"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Initialize rrule and endDate from shiftData
  useEffect(() => {
    if (shiftData?.recurrenceRule) {
      setRrule(shiftData.recurrenceRule);
    }
    if (shiftData?.endDate) {
      setEndDate(shiftData.endDate);
    }
  }, [shiftData]);

  // Calculate endDate automatically when rrule or startDate changes
  useEffect(() => {
    const startDateValue = form.getFieldValue('startDate');
    
    if (!startDateValue) {
      setEndDate(selectedDate.format("YYYY-MM-DD"));
      return;
    }
    
    if (!rrule) {
      // If no recurrence, endDate = startDate
      setEndDate(startDateValue);
    } else {
      // Calculate endDate from last occurrence
      try {
        // Need to add DTSTART to the RRule string for proper parsing
        const dtstartStr = dayjs(startDateValue).format("YYYYMMDDTHHmmss");
        const fullRRule = `DTSTART:${dtstartStr}Z\n${rrule}`;
        const rule = RRule.fromString(fullRRule);
        const allOccurrences = rule.all();
        if (allOccurrences.length > 0) {
          const lastOccurrence = allOccurrences[allOccurrences.length - 1];
          setEndDate(dayjs(lastOccurrence).format('YYYY-MM-DD'));
        } else {
          setEndDate(startDateValue);
        }
      } catch (e) {
        console.error("Error calculating endDate:", e);
        setEndDate(startDateValue);
      }
    }
  }, [rrule, form, selectedDate]);

  // Fetch staff
  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoadingStaff(true);
      try {
        const response = await fetch("/api/staff?limit=1000&status=ACTIVE");
        if (response.ok) {
          const data = await response.json();
          setStaffList(data.staff || []);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        showError("Failed to load staff", "Please refresh the page");
      } finally {
        setIsLoadingStaff(false);
      }
    };

    if (open) {
      fetchStaff();
    }
  }, [open]);

  // Fetch carer
  useEffect(() => {
    const fetchCarer = async () => {
      setIsLoadingCarer(true);
      try {
        const response = await fetch("/api/carer?limit=1000");
        if (response.ok) {
          const data = await response.json();
          setCarerList(data.carers || []);
        }
      } catch (error) {
        console.error("Error fetching carer:", error);
        showError("Failed to load carers", "Please refresh the page");
      } finally {
        setIsLoadingCarer(false);
      }
    };

    if (open) {
      fetchCarer();
    }
  }, [open]);

  const handleDelete = async () => {
    if (!shiftData) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/shift/${shiftData.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete shift");
      }

      showSuccess("Shift deleted successfully!", `The shift has been removed from the schedule`);
      setShowDeleteAlert(false);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      showError("Failed to delete shift", "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-175 overflow-y-auto p-4" ref={sheetRef}>
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl">{isEditMode ? "Edit Shift" : "Add New Shift"}</SheetTitle>
          <SheetDescription>
            {isEditMode 
              ? `Update shift for ${selectedDate.format("MMMM D, YYYY")}`
              : `Create a new shift for ${selectedDate.format("MMMM D, YYYY")}`
            }
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6 mt-2"
        >
          {/* Staff & Carer Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Assignment</h3>

          {/* Staff Dropdown */}
          <form.Field name="staffId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="staffId">Assigned Staff Member *</Label>
                <Select
                  id="staffId"
                  options={staffList.map(formatSelectOption)}
                  value={getSelectedValue(staffList, field.state.value)}
                  onChange={(option) => field.handleChange(option?.value || 0)}
                  placeholder="Select staff"
                  isDisabled={isLoadingStaff}
                  isClearable
                  classNamePrefix="select"
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Carer Dropdown */}
          <form.Field name="carerId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="carerId">Carer to Assist *</Label>
                <Select
                  id="carerId"
                  options={carerList.map((carer) => ({
                    value: carer.id,
                    label: `${carer.name} (${carer.email})`,
                  }))}
                  value={carerList.find(c => c.id === field.state.value) ? {
                    value: field.state.value,
                    label: `${carerList.find(c => c.id === field.state.value)?.name} (${carerList.find(c => c.id === field.state.value)?.email})`
                  } : null}
                  onChange={(option) => field.handleChange(option?.value || 0)}
                  placeholder="Select carer"
                  isDisabled={isLoadingCarer}
                  isClearable
                  classNamePrefix="select"
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pricing</h3>

          {/* Price Amount and Type */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="priceAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="priceAmount">Rate Amount *</Label>
                  <Input
                    id="priceAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="h-11"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="priceType">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="priceType">Rate Type *</Label>
                  <Select
                    id="priceType"
                    options={[
                      { value: "HOURLY", label: "Hourly" },
                      { value: "DAILY", label: "Daily" },
                      { value: "WEEKLY", label: "Weekly" },
                      { value: "MONTHLY", label: "Monthly" },
                    ]}
                    value={field.state.value ? { value: field.state.value, label: field.state.value.charAt(0) + field.state.value.slice(1).toLowerCase() } : null}
                    onChange={(option) => field.handleChange(option?.value as ShiftFormData["priceType"])}
                    placeholder="Select price type"
                    classNamePrefix="select"
                  />
                </div>
              )}
            </form.Field>
          </div>
          {/* Bonus */}
          <form.Field name="bonus">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus (Optional)</Label>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.state.value || ""}
                  onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
            )}
          </form.Field>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Schedule</h3>
          {/* Start Date */}
          <form.Field name="startDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <DatePicker
                  id="startDate"
                  selected={field.state.value ? dayjs(field.state.value).toDate() : null}
                  onChange={(date) => {
                    if (date) {
                      field.handleChange(dayjs(date).format('YYYY-MM-DD'));
                    }
                  }}
                  renderCustomHeader={(props) => (
                    <CustomHeader
                      {...props}
                      selectDate={(date) => {
                        field.handleChange(dayjs(date).format('YYYY-MM-DD'));
                      }}
                    />
                  )}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select date"
                  className={DATE_PICKER_INPUT_CLASS}
                  wrapperClassName="w-full"
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Shift Start and End Time */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="shift_start_time">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="shift_start_time">Shift Start Time *</Label>
                  <DatePicker
                    id="shift_start_time"
                    selected={field.state.value ? dayjs(`2000-01-01 ${field.state.value}`).toDate() : null}
                    onChange={(date) => {
                      if (date) {
                        field.handleChange(dayjs(date).format('HH:mm'));
                      }
                    }}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={30}
                    timeCaption="Time"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"
                    placeholderText="Select time"
                    className={DATE_PICKER_INPUT_CLASS}
                    wrapperClassName="w-full"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="shift_end_time">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="shift_end_time">Shift End Time *</Label>
                  <DatePicker
                    id="shift_end_time"
                    selected={field.state.value ? dayjs(`2000-01-01 ${field.state.value}`).toDate() : null}
                    onChange={(date) => {
                      if (date) {
                        field.handleChange(dayjs(date).format('HH:mm'));
                      }
                    }}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={30}
                    timeCaption="Time"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"
                    placeholderText="Select time"
                    className={DATE_PICKER_INPUT_CLASS}
                    wrapperClassName="w-full"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
          </div>

          {/* End Date (Read-only, auto-calculated) */}
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Auto-calculated)</Label>
            <DatePicker
              id="endDate"
              selected={endDate ? dayjs(endDate).toDate() : null}
              renderCustomHeader={(props) => <CustomHeader {...props} />}
              dateFormat="dd/MM/yyyy"
              disabled
              placeholderText="Auto-calculated"
              className={DATE_PICKER_INPUT_CLASS}
              wrapperClassName="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {rrule ? "Calculated from recurrence rule" : "Same as start date (no recurrence)"}
            </p>
          </div>

          {/* RRule Generator */}
          <div className="space-y-2">
            <Label>Recurrence Rule (Optional)</Label>
            <RRuleGenerator 
              value={rrule} 
              onChange={setRrule} 
              startDate={dayjs(form.getFieldValue("startDate") || selectedDate.format("YYYY-MM-DD"))}
              endTime={endDate}
              onEndTimeChange={(newEndTime) => {
                setEndDate(newEndTime);
              }}
            />
          </div>
          </div>

          {/* Location & Details Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Location & Details</h3>

          {/* Address */}
          <form.Field name="address">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="address">Location Address *</Label>
                <Input
                  id="address"
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter full address"
                  className="h-11"
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Instruction */}
          <form.Field name="instruction">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="instruction">Special Instructions (Optional)</Label>
                <Textarea
                  id="instruction"
                  value={field.state.value || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter any special instructions or notes"
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}
          </form.Field>
          </div>

          <SheetFooter className="pt-6 border-t">
            <div className="flex w-full gap-3">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={isSubmitting}
                  size="lg"
                  className="mr-auto"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                size="lg"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1">
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditMode ? "Update Shift" : "Create Shift"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this shift. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
