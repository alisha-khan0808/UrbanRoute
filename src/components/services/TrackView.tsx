"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    track("service_view", { service: slug });
  }, [slug]);
  return null;
}
