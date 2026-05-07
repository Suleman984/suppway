"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/**
 * Registers GSAP plugins once on the client. Mounted at the layout level
 * so plugin registration happens before any section's effects run.
 *
 * Why a component instead of a top-level call: registering plugins at
 * module scope would also run during SSR import resolution, which can
 * trip on `window`-touching plugins. Doing it inside an effect is safe
 * and runs exactly once on the client.
 */
export function GsapProvider() {
  useEffect(() => {
    if (registered) return;
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }, []);
  return null;
}
