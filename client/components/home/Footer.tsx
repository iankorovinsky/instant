import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  const columns = [
    {
      title: "Company",
      links: [
        { name: "Customers", href: "/customers" },
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { name: "Trader", href: "/solutions/trader" },
        { name: "Portfolio Manager", href: "/solutions/portfolio-manager" },
        { name: "Compliance", href: "/solutions/compliance" },
        { name: "Fintech", href: "/solutions/fintech" },
      ],
    },
    {
      title: "Resources",
      links: [
        {
          name: "Trust Center",
          href: "https://app.vanta.com/withmoment.com/trust/4i3clpfumt4xtjfcj4pm4s",
        },
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms-of-service" },
      ],
    },
    {
      title: "Connect",
      links: [
        {
          name: "LinkedIn",
          href: "https://www.linkedin.com/company/moment-markets/",
        },
        { name: "X", href: "https://x.com/_InstantHQ" },
      ],
    },
  ];

  return (
    <footer className="bg-[#252d2e] text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Instant</span>
            </Link>
          </div>
          {columns.map((column, index) => (
            <div key={`column-${index}`}>
              <h4 className="text-sm font-medium text-white/80 mb-4">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={`link-${linkIndex}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-sm text-white/40">
            North Pole
          </p>
        </div>
      </div>
    </footer>
  );
}
