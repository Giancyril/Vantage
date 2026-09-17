"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Newspaper, Sliders, Bookmark, History, Loader2, CheckCircle2, Rss } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const navItems = [
    { label: "Daily Feed", href: "/feed", icon: Newspaper },
    { label: "Interest Profile", href: "/interests", icon: Sliders },
    { label: "News Sources", href: "/sources", icon: Rss },
    { label: "Saved Stories", href: "/saved", icon: Bookmark },
    { label: "Digest Archive", href: "/digests", icon: History },
  ];

  const handleRunPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunMessage("Discovering & analyzing news...");
    try {
      const res = await fetch("/api/pipeline/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRunMessage(`Curated ${data.report.analyzedCount} stories!`);
        setTimeout(() => {
          setRunMessage(null);
          router.push("/feed");
        }, 1500);
      } else {
        setRunMessage("Pipeline completed with notes.");
        setTimeout(() => setRunMessage(null), 2500);
      }
    } catch {
      setRunMessage("Pipeline completed.");
      setTimeout(() => setRunMessage(null), 2000);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F4]/90 backdrop-blur-md border-b border-[#E9E5DE] w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-11 sm:h-12 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          <Link href="/feed" scroll={false} className="flex items-center space-x-2 group outline-none">
            <span className="font-editorial text-base font-bold tracking-tight text-[#181715] group-hover:text-[#C35824] transition-colors">
              VANTAGE
            </span>
            <span className="text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-[#EAE6DF] text-[#706A60]">
              AI Agent
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center space-x-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/feed" && pathname === "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  scroll={false}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-solid transition-colors select-none outline-none focus:outline-none ${isActive
                      ? "bg-[#181715] text-white border-[#181715]"
                      : "bg-transparent text-[#625C54] hover:text-[#181715] hover:bg-[#ECE8E0] border-transparent"
                    }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA */}
        <div className="flex items-center space-x-2.5">
          {runMessage && (
            <span className="hidden md:inline-flex items-center text-[10px] font-medium text-[#C35824] bg-[#FEF8F4] border border-[#E8B499] px-2 py-0.5 rounded-full animate-pulse-subtle">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-[#C35824]" />
              {runMessage}
            </span>
          )}

          <button
            onClick={handleRunPipeline}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#C35824] hover:bg-[#AB4B1C] text-white shadow-xs transition-colors select-none outline-none focus:outline-none disabled:opacity-70 cursor-pointer"
          >
            {isRunning && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
            <span>{isRunning ? "Synthesizing..." : "Run Digest Pipeline"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
