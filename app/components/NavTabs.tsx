"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
  { href: "/", label: "Grid" },
  { href: "/insights", label: "Insights" },
  { href: "/streaks", label: "Streaks" },
  { href: "/review", label: "Review" },
];

interface NavTabsProps {
  // False while auth state is still being determined — every tab renders
  // unselected, the highlight pill stays hidden, and clicks are inert.
  enabled: boolean;
}

export function NavTabs({ enabled }: NavTabsProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const active = enabled ? pathname : null;
  const highlighted = active === null ? null : hovered ?? active;
  const highlightedEl = highlighted ? refs.current[highlighted] : null;
  const position = highlightedEl
    ? { left: highlightedEl.offsetLeft, width: highlightedEl.offsetWidth, opacity: 1 }
    : { left: 0, width: 0, opacity: 0 };

  return (
    <nav
      className="relative flex items-center gap-0.5 rounded-full bg-[#f4f1ec] p-1"
      onMouseLeave={() => setHovered(null)}
    >
      <motion.div
        className="absolute top-1 bottom-1 rounded-full bg-[#2c2722]"
        animate={position}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
      />
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={enabled ? tab.href : "#"}
          ref={(el) => {
            refs.current[tab.href] = el;
          }}
          aria-disabled={!enabled}
          onClick={(e) => {
            if (!enabled) e.preventDefault();
          }}
          onMouseEnter={() => enabled && setHovered(tab.href)}
          className={`relative z-10 rounded-full px-4 py-[9px] font-medium text-[13px] transition-colors ${
            enabled ? "" : "cursor-default"
          } ${highlighted === tab.href ? "text-[#fbfaf8]" : "text-[#665e54]"}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
