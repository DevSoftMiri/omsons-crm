"use client";

import { ErrorState } from "@/components/ui/state";

export default function Error({ error }: { error: Error }) {
  return <ErrorState message={error.message} />;
}
