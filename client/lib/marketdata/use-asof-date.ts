import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "marketdata.asOfDate";

export function useMarketDataAsOfDate(availableDates: Date[] | undefined) {
  const [asOfDate, setAsOfDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!availableDates || availableDates.length === 0) {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? new Date(stored) : null;
    const isValidStored = parsed && !isNaN(parsed.getTime());
    const match = isValidStored
      ? availableDates.find((d) => d.toDateString() === parsed.toDateString())
      : undefined;

    if (match) {
      setAsOfDate(match);
      return;
    }

    setAsOfDate(availableDates[0]);
  }, [availableDates]);

  const setAndStore = useMemo(() => {
    return (next: Date) => {
      setAsOfDate(next);
      window.localStorage.setItem(STORAGE_KEY, next.toISOString());
    };
  }, []);

  return { asOfDate, setAsOfDate: setAndStore };
}
