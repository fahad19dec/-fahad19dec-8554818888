"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// A page that failed to load (lost session, database busy). Retrying re-checks access.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-md">
      <CardHeader>
        <CardTitle>This page didn’t load</CardTitle>
        <CardDescription>Your session may have ended, or the database was busy. Try again, or sign in again.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <a href="/login" className="inline-flex h-8 items-center px-2.5 text-sm text-primary hover:underline">
          Sign in
        </a>
      </CardContent>
    </Card>
  );
}
