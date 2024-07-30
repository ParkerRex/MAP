import { DateTime } from 'luxon';
import { useCalendar } from '../contexts/CalendarContext';
import { safeParseDate } from '../utils/dateUtils';

export const useWeekNavigation = () => {
  const { currentWeekStartDate, setCurrentWeekStartDate } = useCalendar();

  const handleNextWeek = () => {
    const currentDate = safeParseDate(currentWeekStartDate);
    if (currentDate) {
      const newDate = currentDate.plus({ weeks: 1 });
      setCurrentWeekStartDate(newDate.startOf('week').toJSDate());
    }
  };

  const handleCurrentWeek = () => {
    const today = DateTime.now();
    setCurrentWeekStartDate(today.startOf('week').toJSDate());
  };

  const handlePreviousWeek = () => {
    const currentDate = safeParseDate(currentWeekStartDate);
    if (currentDate) {
      const newDate = currentDate.minus({ weeks: 1 });
      setCurrentWeekStartDate(newDate.startOf('week').toJSDate());
    }
  };

  const handleSetWeek = (date: Date) => {
    const luxonDate = DateTime.fromJSDate(date);
    setCurrentWeekStartDate(luxonDate.startOf('week').toJSDate());
  };

  return {
    handleNextWeek,
    handleCurrentWeek,
    handlePreviousWeek,
    handleSetWeek,
  };
};
