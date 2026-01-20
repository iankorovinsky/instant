import Link from "next/link";
import styles from "./home.module.css";

export function FinalCTA() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#252d2e] mb-8">
          The Operating System for Investment Management
        </h2>
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
    </section>
  );
}
