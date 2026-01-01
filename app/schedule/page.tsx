"use client";
import { NextPage } from "next";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShiftListSheet } from "@/components/shift-list-sheet";
import { groupShiftsByDate, ShiftOccurrence } from "@/lib/shift-utils";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const Page: NextPage = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shiftsByDate, setShiftsByDate] = useState<Record<string, ShiftOccurrence[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Generate years from 1999 to current year
  const currentYear = dayjs().year();
  const years = Array.from({ length: currentYear - 1999 + 1 }, (_, i) => 1999 + i);

  // Month names
  const months = [
    { value: 0, label: "Jan" },
    { value: 1, label: "Feb" },
    { value: 2, label: "Mar" },
    { value: 3, label: "Apr" },
    { value: 4, label: "May" },
    { value: 5, label: "Jun" },
    { value: 6, label: "Jul" },
    { value: 7, label: "Aug" },
    { value: 8, label: "Sep" },
    { value: 9, label: "Oct" },
    { value: 10, label: "Nov" },
    { value: 11, label: "Dec" },
  ];

  // Get the first day of the month
  const firstDayOfMonth = currentDate.startOf("month");
  const lastDayOfMonth = currentDate.endOf("month");

  // Generate weeks of the month
  const getWeeksInMonth = () => {
    const weeks: dayjs.Dayjs[][] = [];
    let currentWeekStart = firstDayOfMonth.startOf("isoWeek");

    while (currentWeekStart.isBefore(lastDayOfMonth) || currentWeekStart.isSame(lastDayOfMonth, "day")) {
      const week: dayjs.Dayjs[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(currentWeekStart.add(i, "day"));
      }
      weeks.push(week);
      currentWeekStart = currentWeekStart.add(1, "week");
    }

    return weeks;
  };

  const weeks = getWeeksInMonth();

  // Fetch shifts for the current month
  const fetchMonthShifts = async () => {
    console.log('[fetchMonthShifts] Starting fetch for', currentDate.format('YYYY-MM'));
    setIsLoading(true);
    
    try {
      // Get the first and last day of the month in YYYY-MM-DD format (local date)
      const monthStart = currentDate.startOf('month').format('YYYY-MM-DD');
      const monthEnd = currentDate.endOf('month').format('YYYY-MM-DD');
      
      console.log('[fetchMonthShifts] Fetching shifts from', monthStart, 'to', monthEnd);
      
      const response = await fetch(
        `/api/shift?startDate=${monthStart}&endDate=${monthEnd}&limit=1000`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch shifts');
      }
      
      const data = await response.json();
      console.log('[fetchMonthShifts] Received', data.shifts?.length || 0, 'shifts from API');
      
      // Get the calendar view range (including days from previous/next month)
      const calendarStart = currentDate.startOf('month').startOf('isoWeek');
      const calendarEnd = currentDate.endOf('month').endOf('isoWeek');
      
      console.log('[fetchMonthShifts] Calendar range:', calendarStart.format('YYYY-MM-DD'), 'to', calendarEnd.format('YYYY-MM-DD'));
        
        // Process and group shifts by date
        const grouped = groupShiftsByDate(data.shifts || [], calendarStart, calendarEnd);
        console.log('[fetchMonthShifts] Grouped shifts into', Object.keys(grouped).length, 'days');
        
        setShiftsByDate(grouped);
      } catch (error) {
        console.error('[fetchMonthShifts] Error fetching shifts:', error);
        setShiftsByDate({});
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchMonthShifts();
  }, [currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, "month"));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  const handleMonthChange = (month: string) => {
    setCurrentDate(currentDate.month(parseInt(month)));
  };

  const handleYearChange = (year: string) => {
    setCurrentDate(currentDate.year(parseInt(year)));
  };

  const handleDayClick = (day: dayjs.Dayjs) => {
    setSelectedDate(day);
    setSheetOpen(true);
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="p-6 w-full h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select
            value={currentDate.month().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDate.year().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.reverse().map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col relative">
        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading shifts...</p>
            </div>
          </div>
        )}
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center border-r last:border-r-0 font-semibold text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="flex-1 grid grid-rows-[repeat(auto-fit,minmax(0,1fr))]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day, dayIndex) => {
                const dateKey = day.format('YYYY-MM-DD');
                const dayShifts = shiftsByDate[dateKey] || [];
                
                return (
                  <div
                    key={dayIndex}
                    className={`border-r last:border-r-0 p-2 cursor-pointer hover:bg-muted/30 transition-colors relative overflow-hidden ${
                      day.month() !== currentDate.month() ? "bg-muted/10" : ""
                    } ${day.isSame(dayjs(), "day") ? "bg-primary/10" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        day.isSame(dayjs(), "day")
                          ? "text-primary font-bold"
                          : day.month() !== currentDate.month()
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      {day.format("D")}
                    </div>
                    
                    {/* Display shifts for this day */}
                    <div className="space-y-1 text-xs">
                      {dayShifts.slice(0, 3).map((shift, idx) => (
                        <div
                          key={`${shift.id}-${shift.occurrenceDate}-${idx}`}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded text-xs truncate"
                          title={`${shift.staff?.name || 'Unknown'} - ${dayjs(`2000-01-01 ${shift.shift_start_time}`).format('h:mm A')} to ${dayjs(`2000-01-01 ${shift.shift_end_time}`).format('h:mm A')}`}
                        >
                          <div className="font-medium truncate">
                            {shift.staff?.name || 'Unknown'}
                          </div>
                          <div className="text-[10px] opacity-80">
                            {dayjs(`2000-01-01 ${shift.shift_start_time}`).format('h:mm A')} - {dayjs(`2000-01-01 ${shift.shift_end_time}`).format('h:mm A')}
                          </div>
                        </div>
                      ))}
                      {dayShifts.length > 3 && (
                        <div className="text-muted-foreground text-[10px] pl-1">
                          +{dayShifts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <ShiftListSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedDate={selectedDate}
        onRefreshShifts={fetchMonthShifts}
      />
    </div>
  );
};

export default Page;