"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  /** Hex string like "#ff3b3b" — colors the particle field */
  accent: string;
  /** Whether the user's pointer is hovering the hero (intensifies the field) */
  hovered?: boolean;
}

/**
 * Lightweight WebGL ambience layer for the PDP hero. Renders a slow drifting
 * particle field tinted to the product accent color, with very gentle mouse
 * parallax. Stays decorative, never demands attention:
 *
 * - Pauses when the canvas is off-screen (IntersectionObserver)
 * - Respects `prefers-reduced-motion` (renders one static frame, then stops)
 * - Cleans up GL resources on unmount
 * - Tiny scene: 1 PointsMaterial, ~140 points, no lights, no post-processing
 */
export function ProductHeroFx({ accent, hovered = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(hovered);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    // Particle field — random points in a flat-ish slab in front of the camera
    const COUNT = 140;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(accent),
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
    }
    mount.addEventListener("pointermove", onMove);

    let raf = 0;
    let visible = true;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // ease camera toward target — slow, low amplitude
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      camera.position.x = mouse.x * 0.7;
      camera.position.y = -mouse.y * 0.7;
      camera.lookAt(0, 0, 0);

      // gentle continuous drift on the field itself
      const speed = hoveredRef.current ? 0.06 : 0.025;
      points.rotation.y += dt * speed;
      points.rotation.x += dt * speed * 0.4;
      material.opacity = hoveredRef.current ? 0.75 : 0.55;

      renderer.render(scene, camera);
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    }

    if (reduced) {
      // one static frame, then stop
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(frame);
    }

    // pause when off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        if (visible && !reduced && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        } else if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 },
    );
    io.observe(mount);

    // resize
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mount.removeEventListener("pointermove", onMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [accent]);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    />
  );
}
