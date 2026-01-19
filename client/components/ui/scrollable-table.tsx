"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function ScrollableTable({
  children,
  className,
  maxHeight = "100%",
}: ScrollableTableProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showTopIndicator, setShowTopIndicator] = React.useState(false);
  const [showBottomIndicator, setShowBottomIndicator] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const isScrollable = scrollHeight > clientHeight;

    setShowTopIndicator(isScrollable && scrollTop > 0);
    setShowBottomIndicator(isScrollable && scrollTop < scrollHeight - clientHeight - 1);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll);

    // Also check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  return (
    <div className={cn("relative", className)} style={{ maxHeight }}>
      {/* Top scroll indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-4 pointer-events-none z-20 transition-opacity duration-200",
          "bg-gradient-to-b from-card/80 to-transparent",
          showTopIndicator ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        style={{ maxHeight }}
      >
        {children}
      </div>

      {/* Bottom scroll indicator */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-4 pointer-events-none z-20 transition-opacity duration-200",
          "bg-gradient-to-t from-card/80 to-transparent",
          showBottomIndicator ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
