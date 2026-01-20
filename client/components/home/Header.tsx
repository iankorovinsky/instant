"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X, Zap } from "lucide-react";
import styles from "./home.module.css";

export function Header() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbfbfb]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#252d2e]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#252d2e]">Instant</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/customers"
            className="text-sm font-medium text-[#252d2e] hover:text-[#748484] transition-colors"
          >
            Customers
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-[#252d2e] hover:text-[#748484] transition-colors"
            >
              Solutions
              <ChevronDown className="w-4 h-4" />
            </button>
            {solutionsOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                <Link
                  href="/solutions/trader"
                  className="block px-4 py-2 text-sm text-[#252d2e] hover:bg-gray-50"
                >
                  Trader
                </Link>
                <Link
                  href="/solutions/portfolio-manager"
                  className="block px-4 py-2 text-sm text-[#252d2e] hover:bg-gray-50"
                >
                  Portfolio Manager
                </Link>
                <Link
                  href="/solutions/compliance"
                  className="block px-4 py-2 text-sm text-[#252d2e] hover:bg-gray-50"
                >
                  Compliance
                </Link>
                <Link
                  href="/solutions/fintech"
                  className="block px-4 py-2 text-sm text-[#252d2e] hover:bg-gray-50"
                >
                  Fintech
                </Link>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-[#252d2e] hover:text-[#748484] transition-colors"
            >
              About
              <ChevronDown className="w-4 h-4" />
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                <Link
                  href="/about"
                  className="block px-4 py-2 text-sm text-[#252d2e] hover:bg-gray-50"
                >
                  About Us
                </Link>
                <Link
                  href="/careers"
                  className="block px-4 py-2 text-sm text-[#252d2e] hover:bg-gray-50"
                >
                  Careers
                </Link>
                <Link
                  href="/blog"
                  className="block px-4 py-2 text-sm text-[#252d2e] hover:bg-gray-50"
                >
                  Blog
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-[#252d2e] hover:text-[#748484] transition-colors px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300"
          >
            Sign In
          </Link>
          <Link
            href="/case-study"
            className={`${styles.btnHover} flex items-center gap-2 bg-[#252d2e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#1a2021] transition-colors`}
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

        <button
          type="button"
          className="md:hidden p-2 text-[#252d2e]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-6 py-4 space-y-4">
            <Link
              href="/customers"
              className="block text-sm font-medium text-[#252d2e]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Customers
            </Link>
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#7c7c7c] uppercase tracking-wider">
                Solutions
              </p>
              <Link
                href="/solutions/trader"
                className="block text-sm text-[#252d2e] pl-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Trader
              </Link>
              <Link
                href="/solutions/portfolio-manager"
                className="block text-sm text-[#252d2e] pl-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Portfolio Manager
              </Link>
              <Link
                href="/solutions/compliance"
                className="block text-sm text-[#252d2e] pl-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compliance
              </Link>
              <Link
                href="/solutions/fintech"
                className="block text-sm text-[#252d2e] pl-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fintech
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#7c7c7c] uppercase tracking-wider">
                About
              </p>
              <Link
                href="/about"
                className="block text-sm text-[#252d2e] pl-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/careers"
                className="block text-sm text-[#252d2e] pl-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Careers
              </Link>
              <Link
                href="/blog"
                className="block text-sm text-[#252d2e] pl-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
            </div>
            <div className="pt-4 space-y-3 border-t border-gray-100">
              <Link
                href="/auth/login"
                className="block text-sm font-medium text-[#252d2e] text-center py-2 rounded-full border border-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/case-study"
                className="block text-sm font-medium text-white bg-[#252d2e] text-center py-2 rounded-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Case Study
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
