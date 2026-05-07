"use client";

import { BRAND } from "@/lib/brand";
import { ParticleText } from "./particle-text";

interface Props {
  className?: string;
  delay?: number;
}

export function BrandParticles({ className = "", delay = 0 }: Props) {
  return (
    <ParticleText className={className} delay={delay}>
      {BRAND.name}
    </ParticleText>
  );
}
