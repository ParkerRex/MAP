import { useCalendar } from "@/store/calendar-context";
import { addWeeks, startOfWeek, subWeeks } from "date-fns";

export const useWeekNavigation = () => {
  const { currentWeekStartDate, setCurrentWeekStartDate } = useCalendar();

  const handleNextWeek = () => {
    const newDate = addWeeks(currentWeekStartDate, 1);
    setCurrentWeekStartDate(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    setCurrentWeekStartDate(startOfWeek(today, { weekStartsOn: 1 }));
  };

  const handlePreviousWeek = () => {
    const newDate = subWeeks(currentWeekStartDate, 1);
    setCurrentWeekStartDate(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const handleSetWeek = (date: Date) => {
    setCurrentWeekStartDate(startOfWeek(date, { weekStartsOn: 1 }));
  };

  return {
    handleNextWeek,
    handleCurrentWeek,
    handlePreviousWeek,
    handleSetWeek,
  };
};
