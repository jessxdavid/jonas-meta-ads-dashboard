"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Megaphone,
  Layers,
  Image as ImageIcon,
  Users,
  Wallet,
  LineChart,
  Flame,
  Filter,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/ad-sets", label: "Ad Sets", icon: Layers },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/funnel", label: "Funnel", icon: Filter },
  { href: "/creatives", label: "Creatives", icon: ImageIcon },
  { href: "/fatigue", label: "Fatigue", icon: Flame },
  { href: "/audiences", label: "Audiences", icon: Users },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/do-not-click", label: "Do Not Click", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const [logoLoaded, setLogoLoaded] = useState(true);
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-border)] px-5">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
          {logoLoaded ? (
            <img
              src="/logo.png"
              alt="Info Ops"
              className="h-7 w-7 object-contain"
              onError={() => setLogoLoaded(false)}
            />
          ) : (
            <span className="text-sm font-bold text-white">IO</span>
          )}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Info Ops &middot; Jonas</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Meta Ads Dashboard</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] hover:text-white",
              )}
            >
              <Icon
                size={16}
                strokeWidth={2}
                className={active ? "text-[var(--color-accent)]" : ""}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] p-4 text-xs text-[var(--color-text-muted)]">
        <div className="font-mono">v0.1.0</div>
        <div>Meta Marketing API v21.0</div>
      </div>
    </aside>
  );
}
