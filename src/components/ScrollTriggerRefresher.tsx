"use client";

import React from "react";
import { useScrollAnimations } from "@/hooks/use-scroll-animations";

export default function ScrollTriggerRefresher() {
  // This component simply runs the client-only hook on mount to refresh/cleanup ScrollTrigger
  useScrollAnimations();
  return null;
}
