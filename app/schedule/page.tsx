"use client";
import { NextPage } from "next";
import { useState } from "react";
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
import { showInfo } from "@/lib/toast";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const Page: NextPage = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());

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
    showInfo("Day Selected", day.format("dddd, MMMM D, YYYY"));
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
      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
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
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`border-r last:border-r-0 p-3 cursor-pointer hover:bg-muted/30 transition-colors relative ${
                    day.month() !== currentDate.month() ? "bg-muted/10" : ""
                  } ${day.isSame(dayjs(), "day") ? "bg-primary/10" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div
                    className={`text-sm font-medium ${
                      day.isSame(dayjs(), "day")
                        ? "text-primary font-bold"
                        : day.month() !== currentDate.month()
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    {day.format("D")}
                  </div>
                  {/* Day content will go here */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;