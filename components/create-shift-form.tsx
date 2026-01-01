"use client";

import { useForm } from "@tanstack/react-form";
import type { FormApi } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import dayjs from "dayjs";
import { RRuleGenerator } from "./rrule-generator";
import { RRule } from "rrule";

const shiftSchema = z.object({
  staffId: z.number().min(1, "Staff is required"),
  carerId: z.number().min(1, "Carer is required"),
  priceAmount: z.number().min(0, "Price must be positive"),
  priceType: z.enum(["WEEKLY", "HOURLY", "DAILY", "MONTHLY"]),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  address: z.string().min(1, "Address is required"),
  bonus: z.number().optional(),
  instruction: z.string().optional(),
  recurrenceRule: z.string().optional(),
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
  start_time: string;
  end_time: string;
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
  const isEditMode = !!shiftData;

  const form = useForm({
    defaultValues: {
      staffId: shiftData?.staffId || (undefined as number | undefined),
      carerId: shiftData?.carerId || (undefined as number | undefined),
      priceAmount: shiftData?.priceAmount || 0,
      priceType: (shiftData?.priceType || "HOURLY") as ShiftFormData["priceType"],
      start_time: shiftData?.start_time 
        ? dayjs(shiftData.start_time).format("YYYY-MM-DDTHH:mm")
        : selectedDate.format("YYYY-MM-DDTHH:mm"),
      end_time: shiftData?.end_time
        ? dayjs(shiftData.end_time).format("YYYY-MM-DDTHH:mm")
        : selectedDate.add(1, "hour").format("YYYY-MM-DDTHH:mm"),
      address: shiftData?.address || "",
      bonus: shiftData?.bonus || (0 as number | undefined),
      instruction: shiftData?.instruction || "",
      recurrenceRule: shiftData?.recurrenceRule || "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        // Calculate occurrences and summary if rrule exists
        let occurrences = null;
        let summary = null;
        
        if (rrule) {
          try {
            const rule = RRule.fromString(rrule);
            const options = rule.origOptions;
            occurrences = options.count || null;
            summary = rule.toText();
          } catch (e) {
            console.error("Error parsing rrule:", e);
          }
        }

        // Calculate hours from start_time and end_time
        const start = dayjs(value.start_time);
        const end = dayjs(value.end_time);
        const hours = end.diff(start, 'hour', true);

        const payload = {
          ...value,
          start_time: new Date(value.start_time).toISOString(),
          end_time: new Date(value.end_time).toISOString(),
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
          throw new Error(`Failed to ${isEditMode ? "update" : "create"} shift`);
        }

        showSuccess(
          `Shift ${isEditMode ? "updated" : "created"} successfully!`,
          `The shift has been ${isEditMode ? "updated" : "added to the schedule"}`
        );
        onOpenChange(false);
        onSuccess?.();
        form.reset();
        setRrule("");
      } catch {
        showError(
          `Failed to ${isEditMode ? "update" : "create"} shift`,
          "Please try again"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Initialize rrule from shiftData
  useEffect(() => {
    if (shiftData?.recurrenceRule) {
      setRrule(shiftData.recurrenceRule);
    }
  }, [shiftData]);

  // Fetch staff
  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoadingStaff(true);
      try {
        const response = await fetch("/api/staff?limit=1000");
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
  }, [open, form]);

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
  }, [open, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Shift" : "Add New Shift"}</SheetTitle>
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
          className="space-y-4 mt-6"
        >
          {/* Staff Dropdown */}
          <form.Field name="staffId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="staffId">Staff *</Label>
                <Select
                  value={field.state.value ? field.state.value.toString() : undefined}
                  onValueChange={(value) => field.handleChange(parseInt(value))}
                  disabled={isLoadingStaff}
                >
                  <SelectTrigger id="staffId">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.name} ({staff.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Carer Dropdown */}
          <form.Field name="carerId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="carerId">Carer *</Label>
                <Select
                  value={field.state.value ? field.state.value.toString() : undefined}
                  onValueChange={(value) => field.handleChange(parseInt(value))}
                  disabled={isLoadingCarer}
                >
                  <SelectTrigger id="carerId">
                    <SelectValue placeholder="Select carer" />
                  </SelectTrigger>
                  <SelectContent>
                    {carerList.map((carer) => (
                      <SelectItem key={carer.id} value={carer.id.toString()}>
                        {carer.name} ({carer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Price Amount and Type */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="priceAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="priceAmount">Price Amount *</Label>
                  <Input
                    id="priceAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="priceType">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="priceType">Price Type *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as ShiftFormData["priceType"])}
                  >
                    <SelectTrigger id="priceType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          {/* Start and End Time */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="start_time">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="end_time">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Address */}
          <form.Field name="address">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter address"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

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
                />
              </div>
            )}
          </form.Field>

          {/* Instruction */}
          <form.Field name="instruction">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="instruction">Instructions (Optional)</Label>
                <Textarea
                  id="instruction"
                  value={field.state.value || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter any special instructions"
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          {/* RRule Generator */}
          <div className="space-y-2">
            <Label>Recurrence Rule (Optional)</Label>
            <RRuleGenerator 
              value={rrule} 
              onChange={setRrule} 
              startDate={selectedDate}
              endTime={form.getFieldValue("end_time")}
              onEndTimeChange={(newEndTime) => {
                form.setFieldValue("end_time", newEndTime);
              }}
            />
          </div>

          <SheetFooter className="pt-4">
            <div className="flex w-full gap-2">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (!shiftData) return;
                    
                    if (confirm("Are you sure you want to delete this shift?")) {
                      try {
                        const response = await fetch(`/api/shift/${shiftData.id}`, {
                          method: "DELETE",
                        });

                        if (!response.ok) {
                          throw new Error("Failed to delete shift");
                        }

                        showSuccess("Shift deleted", "The shift has been removed");
                        onOpenChange(false);
                        onSuccess?.();
                      } catch {
                        showError("Failed to delete shift", "Please try again");
                      }
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="ml-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
    </Sheet>
  );
}
