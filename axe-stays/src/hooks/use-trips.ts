import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { Refund } from "@/lib/booking/pricing";
import { useAuthedApi, useSession } from "@/lib/session";

/** A booking as GET /api/bookings returns it (src/lib/db/bookings.ts BookingSummary). */
export type Trip = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets: number;
  nights: number;
  nightlyTotalCents: number;
  discountCents: number;
  cleaningCents: number;
  petFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
  status: "confirmed" | "cancelled";
  refundCents: number;
  cancelledBy: "guest" | "admin" | null;
  cancelReason: string | null;
  paymentRef: string;
  createdAt: string;
  cancelledAt: string | null;
  stay: { slug: string; title: string; city: string; region: string | null; country: string; photoUrl: string | null };
};

// The guest's trips, fetched each time the screen comes into focus, so a
// cancellation made in the admin dashboard shows up when they look again.
export function useTrips() {
  const { isSignedIn } = useSession();
  const request = useAuthedApi();
  const [trips, setTrips] = useState<Trip[]>();
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { bookings } = await request<{ bookings: Trip[] }>("/api/bookings");
      setTrips(bookings);
      setError(null);
    } catch (e) {
      setError(e as Error);
    }
  }, [request]);

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) load();
    }, [isSignedIn, load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { trips: isSignedIn ? trips : undefined, error, refresh, refreshing, retry: load };
}

/** One trip with the refund cancelling now would give. */
export function useTrip(id: string) {
  const request = useAuthedApi();
  const [data, setData] = useState<{ booking: Trip; refund: Refund | null } | null>();
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await request<{ booking: Trip; refund: Refund | null }>(`/api/bookings/${encodeURIComponent(id)}`));
      setError(null);
    } catch (e) {
      setError(e as Error);
      if ((e as { status?: number }).status === 404) setData(null);
    }
  }, [id, request]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { data, error, reload: load };
}
