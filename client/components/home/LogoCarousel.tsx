"use client";

import Link from "next/link";
import styles from "./home.module.css";

const logos = [
  { name: "Edward Jones", style: "font-serif font-bold" },
  { name: "Hightower", style: "font-sans font-semibold" },
  { name: "Apex", style: "font-sans font-bold uppercase tracking-wider" },
  { name: "LPL Financial", style: "font-sans font-semibold" },
  { name: "Altruist", style: "font-sans font-medium italic" },
  { name: "Sanctuary", style: "font-serif font-semibold" },
  { name: "DriveWealth", style: "font-sans font-bold" },
  { name: "Webull", style: "font-sans font-bold" },
];

export function LogoCarousel() {
  return (
    <section className="py-12 bg-[#fbfbfb] overflow-hidden">
      <Link href="/customers" className="block">
        <div className="flex items-center">
          <div
            className={`${styles.scrollLeft} flex items-center gap-16 whitespace-nowrap`}
          >
            {logos.map((logo, index) => (
              <div
                key={`first-${logo.name}-${index}`}
                className="flex items-center justify-center h-12 opacity-40 hover:opacity-70 transition-opacity"
              >
                <span className={`text-lg text-[#252d2e] ${logo.style}`}>
                  {logo.name}
                </span>
              </div>
            ))}
            {logos.map((logo, index) => (
              <div
                key={`second-${logo.name}-${index}`}
                className="flex items-center justify-center h-12 opacity-40 hover:opacity-70 transition-opacity"
              >
                <span className={`text-lg text-[#252d2e] ${logo.style}`}>
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </section>
  );
}
