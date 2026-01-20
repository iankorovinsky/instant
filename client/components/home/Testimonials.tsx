"use client";

import Link from "next/link";
import styles from "./home.module.css";

const testimonials = [
  {
    iconColor: "bg-emerald-100 text-emerald-600",
    stat: "10X increase in productivity",
    quote:
      "In my 25+ years of experience, Instant is the innovative solution we've been waiting for and the only player in the market offering a single, unified fixed income platform.",
    author: "Michael Haire",
    role: "Senior VP of Fixed Income at LPL",
    link: "/blog/lpl-announcement",
    linkText: "Read LPL announcement",
  },
  {
    iconColor: "bg-teal-100 text-teal-600",
    stat: "Bond portfolios built in seconds",
    quote:
      "We haven't had people building fixed income tech with that caliber, a mix of best-in-class software engineers and fixed income experts from Wall Street.",
    author: "Jason Wenk",
    role: "CEO of Altruist",
    link: "/customers/altruist",
    linkText: "Read Altruist study",
  },
  {
    iconColor: "bg-cyan-100 text-cyan-600",
    stat: "200X lower bond minimums",
    quote:
      "We're giving our partners the ability to stream differentiated bond liquidity and deliver institutional-grade portfolio tools, without the heavy lift of building the infrastructure themselves.",
    author: "Michael Blaugrund",
    role: "CEO of DriveWealth",
    link: "/customers/drivewealth",
    linkText: "Read DriveWealth study",
  },
  {
    iconColor: "bg-sky-100 text-sky-600",
    stat: "10X lower minimums",
    quote:
      "Instant is the ideal partner. They work closely together with clients to offer a seamless, high-quality experience out of the box.",
    author: "Sam Nofzinger",
    role: "GM of Brokerage at Public",
    link: "/customers/public",
    linkText: "Read Public study",
  },
  {
    iconColor: "bg-indigo-100 text-indigo-600",
    stat: "$100 minimum for fractional Treasuries",
    quote:
      "By leveraging Instant's smart order router and limiting our own spread to just 0.1%, Webull is able to deliver some of the most competitive pricing available to individual bond buyers.",
    author: "Webull Team",
    role: "",
    link: "/customers/webull",
    linkText: "Read Webull study",
  },
  {
    iconColor: "bg-violet-100 text-violet-600",
    stat: "99.99% auto execution",
    quote:
      "In just 8 weeks, we automated over 99% of trades and pioneered fractional bond access, tearing down barriers that once kept retail investors out.",
    author: "Bill Capuzzi",
    role: "CEO of Apex Fintech Solutions",
    link: "/customers/apex-fintech-solutions",
    linkText: "Read Apex study",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-[#fbfbfb]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-[#252d2e] mb-16">
          Powering investment management for leading financial institutions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={`testimonial-${index}`}
              className={`${styles.testimonialCard} bg-white rounded-2xl p-6 border border-gray-100`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full ${testimonial.iconColor} flex items-center justify-center`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#748484]">
                  {testimonial.stat}
                </span>
              </div>

              <blockquote className="text-[#252d2e] text-sm leading-relaxed mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="mb-4">
                <p className="text-sm font-medium text-[#252d2e]">
                  {testimonial.author}
                </p>
                {testimonial.role && (
                  <p className="text-xs text-[#7c7c7c]">{testimonial.role}</p>
                )}
              </div>

              <Link
                href={testimonial.link}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#748484] hover:text-[#252d2e] transition-colors"
              >
                {testimonial.linkText}
                <svg
                  className="w-4 h-4"
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
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
