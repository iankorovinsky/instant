"use client";

import Link from "next/link";
import styles from "./home.module.css";

export function Hero() {
  const lines = Array.from({ length: 72 }, (_, i) => i);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[200vw] h-[200vh]">
          {lines.map((i) => {
            const angle = (i * 360) / 72;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left h-px"
                style={{
                  width: "100%",
                  transform: `rotate(${angle}deg)`,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(180,180,180,0.25) 10%, rgba(180,180,180,0.25) 90%, transparent 100%)",
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(251,251,251,1) 0%, rgba(251,251,251,0.9) 45%, rgba(251,251,251,0) 70%)",
          }}
        />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#252d2e] leading-tight tracking-tight">
          Solving the Hardest Problems
          <br />
          in Investment Management
        </h1>

        <p className="mt-6 text-lg text-[#7c7c7c] max-w-xl mx-auto">
          Engineering the future of investment management with the world&apos;s
          leading financial institutions.
        </p>

        <div className="mt-8">
          <Link
            href="/case-study"
            className={`${styles.btnHover} inline-flex items-center gap-2 bg-[#252d2e] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#1a2021] transition-colors`}
          >
            Case Study
            <span className={styles.btnArrowContainer}>
              <svg
                className={styles.btnArrow}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-20 left-0 right-0 text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-[#979898] uppercase">
          Trusted by firms with $8T+ in assets
        </p>
      </div>
    </section>
  );
}
