import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { IconButton, Text } from "@/components/ui";
import { addDays, todayIso } from "@/lib/booking/pricing";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS_AHEAD = 12;

/** Booked stays as [checkIn, checkOut): the night of `checkOut` is free again. */
export type BookedRange = { checkIn: string; checkOut: string };

const isNightBooked = (night: string, booked: BookedRange[]) => booked.some((b) => b.checkIn <= night && night < b.checkOut);

const monthStart = (date: string) => `${date.slice(0, 7)}-01`;
const shiftMonth = (first: string, by: number) => {
  const d = new Date(`${first}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 10);
};
const monthLabel = (first: string) =>
  new Date(`${first}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

// Pick check-in, then check-out. Past days and booked nights can't start a
// stay, and a stay can't run across a booked night; the morning a booking
// starts is still a valid check-out.
export function DateRangeCalendar({
  checkIn,
  checkOut,
  booked,
  onChange,
}: {
  checkIn?: string;
  checkOut?: string;
  booked: BookedRange[];
  onChange: (range: { checkIn?: string; checkOut?: string }) => void;
}) {
  const today = todayIso();
  const [month, setMonth] = useState(monthStart(checkIn ?? today));
  const firstMonth = monthStart(today);
  const lastMonth = shiftMonth(firstMonth, MONTHS_AHEAD);

  const weeks = useMemo(() => {
    const first = new Date(`${month}T00:00:00Z`);
    const lead = first.getUTCDay();
    const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => addDays(month, i))];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [month]);

  // Choosing check-out: the first booked night after check-in caps the range.
  const choosingOut = !!checkIn && !checkOut;
  const limit = useMemo(() => {
    if (!choosingOut) return undefined;
    const next = booked.filter((b) => b.checkIn > checkIn!).sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
    return next?.checkIn;
  }, [booked, checkIn, choosingOut]);

  const enabled = (day: string) => {
    if (day < today) return false;
    if (choosingOut && day > checkIn!) return !limit || day <= limit;
    return !isNightBooked(day, booked);
  };

  const press = (day: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (choosingOut && day > checkIn!) onChange({ checkIn, checkOut: day });
    else onChange({ checkIn: day, checkOut: undefined });
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <IconButton
          icon="chevronLeft"
          size="sm"
          variant="muted"
          accessibilityLabel="Previous month"
          disabled={month <= firstMonth}
          onPress={() => setMonth(shiftMonth(month, -1))}
        />
        <Text variant="subtitle" accessibilityRole="header">
          {monthLabel(month)}
        </Text>
        <IconButton
          icon="chevronRight"
          size="sm"
          variant="muted"
          accessibilityLabel="Next month"
          disabled={month >= lastMonth}
          onPress={() => setMonth(shiftMonth(month, 1))}
        />
      </View>
      <View className="flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text key={i} variant="footnote" tone="subtle" className="flex-1 text-center">
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} className="flex-row">
          {week.map((day, i) => {
            if (!day) return <View key={i} className="h-11 flex-1" />;
            const ok = enabled(day);
            const isEnd = day === checkIn || day === checkOut;
            const inRange = !!checkIn && !!checkOut && day > checkIn && day < checkOut;
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })}
                accessibilityState={{ disabled: !ok, selected: isEnd || inRange }}
                disabled={!ok}
                onPress={() => press(day)}
                className={cn("h-11 flex-1 items-center justify-center", inRange && "bg-primary-soft")}
              >
                <View className={cn("size-10 items-center justify-center rounded-full", isEnd && "bg-primary")}>
                  <Text variant="label" tone={ok || isEnd ? "ink" : "subtle"} className={ok || isEnd ? undefined : "line-through"}>
                    {Number(day.slice(8))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
