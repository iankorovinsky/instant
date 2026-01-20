import Link from "next/link";

export function Security() {
  const features = [
    {
      title: "99.99% uptime.",
      description:
        "Built for mission-critical performance. Infrastructure that delivers the stability and resilience that enterprise teams need.",
      extra: "Jan 15, 2:04 PM  100%",
    },
    {
      title: "Industry-standard certifications.",
      description:
        "SOC 2 Type I & II certified. Meeting the highest standards for data protection and system reliability.",
      hasLink: true,
      linkText: "Trust center",
      linkUrl:
        "https://app.vanta.com/withmoment.com/trust/4i3clpfumt4xtjfcj4pm4s",
    },
    {
      title: "Fully encrypted, end-to-end.",
      description: "Secure at rest, in transit, and at every stage in between.",
    },
    {
      title: "SAML SSO.",
      description:
        "Enterprise-grade access control with secure SAML Single Sign-On.",
    },
    {
      title: "Advanced user permissioning.",
      description: "Set custom access at every level for rapid scaling.",
    },
  ];

  const benefits = [
    {
      title: "Get up and running in weeks.",
      description: "Implementation shouldn't take months or even years.",
    },
    {
      title: "Frequent, stable updates.",
      description: "Don't wait for quarterly releases.",
    },
  ];

  return (
    <section className="py-24 bg-[#fbfbfb]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm text-[#7c7c7c] mb-2">
            Built with safety as a priority
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={`feature-${index}`}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <h4 className="text-lg font-medium text-[#252d2e] mb-2">
                {feature.title}
              </h4>
              <p className="text-sm text-[#7c7c7c] leading-relaxed mb-3">
                {feature.description}
              </p>
              {feature.extra && (
                <p className="text-xs text-emerald-600 font-mono bg-emerald-50 px-3 py-1 rounded-full inline-block">
                  {feature.extra}
                </p>
              )}
              {feature.hasLink && (
                <Link
                  href={feature.linkUrl || "#"}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#748484] hover:text-[#252d2e] transition-colors"
                >
                  {feature.linkText}
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
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#748484] hover:text-[#252d2e] transition-colors mb-4"
              >
                About Instant
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
              <h3 className="text-2xl font-semibold text-[#252d2e] mb-6">
                Premier investment management solutions for modern firms
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={`benefit-${index}`}>
                    <h5 className="text-sm font-medium text-[#252d2e]">
                      {benefit.title}
                    </h5>
                    <p className="text-sm text-[#7c7c7c]">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <blockquote className="text-[#252d2e] mb-4 leading-relaxed">
                &ldquo;Instant&apos;s fixed income technology is so
                revolutionary, our senior leadership team has started weaving it
                into our recruiting pitches with significant advisor
                teams.&rdquo;
              </blockquote>
              <div>
                <p className="text-sm font-medium text-[#252d2e]">
                  Josh Freeman
                </p>
                <p className="text-xs text-[#7c7c7c]">
                  Head of Capital Markets at Sanctuary Wealth
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
