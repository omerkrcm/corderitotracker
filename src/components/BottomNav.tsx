"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Today", icon: "🏠" },
  { href: "/log", label: "Log", icon: "➕" },
  { href: "/foods", label: "Foods", icon: "🍽️" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-lg justify-around">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-7 w-9 items-center justify-center rounded-full text-lg leading-none ${
                    isActive ? "bg-accent-soft" : ""
                  }`}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
