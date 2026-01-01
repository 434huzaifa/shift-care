"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { IoAdd } from "react-icons/io5";
import { CreateShiftForm } from "./create-shift-form";
import { Spinner } from "@/components/ui/spinner";
import { showError } from "@/lib/toast";

interface Shift {
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

interface ShiftListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: dayjs.Dayjs | null;
}

export function ShiftListSheet({
  open,
  onOpenChange,
  selectedDate,
}: ShiftListSheetProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (open && selectedDate) {
      fetchShifts();
    }
  }, [open, selectedDate]);

  const fetchShifts = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    try {
      // Use local date boundaries instead of UTC
      const startDate = selectedDate.startOf("day").format("YYYY-MM-DD");
      const endDate = selectedDate.endOf("day").format("YYYY-MM-DD");
      
      const response = await fetch(
        `/api/shift?startDate=${startDate}&endDate=${endDate}&limit=100`
      );
      
      if (response.ok) {
        const data = await response.json();
        // Sort shifts by start_time
        const sortedShifts = (data.shifts || []).sort((a: Shift, b: Shift) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        setShifts(sortedShifts);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
      showError("Failed to load shifts", "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setSelectedShift(null);
  };

  const handleSuccess = () => {
    fetchShifts();
    handleCloseForm();
  };

  if (!selectedDate) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>
              Shifts - {selectedDate.format("dddd, MMMM D, YYYY")}
            </SheetTitle>
            <SheetDescription>
              All shifts scheduled for this day
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No shifts scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    onClick={() => handleShiftClick(shift)}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-semibold">
                          {dayjs(shift.start_time).format("h:mm A")} -{" "}
                          {dayjs(shift.end_time).format("h:mm A")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Staff:</span> {shift.staff?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Carer:</span> {shift.carer?.name || 'Unknown'}
                        </div>
                        {shift.occurrences && (
                          <div className="text-xs text-blue-600">
                            🔁 {shift.occurrences} occurrences
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${shift.priceAmount}
                          <span className="text-xs text-muted-foreground">
                            /{shift.priceType}
                          </span>
                        </div>
                        {shift.bonus && (
                          <div className="text-xs text-green-600">
                            +${shift.bonus} bonus
                          </div>
                        )}
                      </div>
                    </div>
                    {shift.address && (
                      <div className="text-xs text-muted-foreground mt-2">
                        📍 {shift.address}
                      </div>
                    )}
                    {shift.summary && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {shift.summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => {
                setSelectedShift(null);
                setShowCreateForm(true);
              }}
              className="w-full"
              size="lg"
            >
              <IoAdd className="mr-2 h-5 w-5" />
              Add Shift
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <CreateShiftForm
        open={showCreateForm}
        onOpenChange={handleCloseForm}
        selectedDate={selectedDate}
        shiftData={selectedShift}
        onSuccess={handleSuccess}
      />
    </>
  );
}
