import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

const solutions = [
  {
    subtitle: "Purpose-built for modern",
    title: "Traders",
    heading: "Leverage the most powerful trader workstation on the street",
    description:
      "An order and execution management system with automated trading and advanced order management capabilities that scales with you.",
    link: "/solutions/trader",
    products: ["OMS", "EMS", "Data and Analytics", "Risk and Compliance"],
    image: "/home/home-1.png",
  },
  {
    subtitle: "Purpose-built for modern",
    title: "Portfolio managers",
    heading: "Deliver personalized portfolios across 100K+ accounts",
    description:
      "A powerful portfolio management system designed to handle multiple sleeves, millions of accounts, and flexible customizations.",
    link: "/solutions/portfolio-manager",
    products: ["PMS", "OMS", "Portfolio Accounting", "Data and Analytics"],
    image: "/home/home-2.png",
  },
  {
    subtitle: "Purpose-built for modern",
    title: "Compliance",
    heading:
      "Stay compliant at every layer, from pre-trade checks to post-trade audits",
    description:
      "Configure checks across every workflow. Set firmwide rules and account-level controls. Monitor activity in real time.",
    link: "/solutions/compliance",
    products: ["OMS", "Risk and Compliance"],
    image: "/home/home-3.png",
  },
];

const productColors: { [key: string]: string } = {
  PMS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OMS: "bg-teal-50 text-teal-700 border-teal-200",
  EMS: "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Portfolio Accounting": "bg-sky-50 text-sky-700 border-sky-200",
  "Risk and Compliance": "bg-slate-50 text-slate-700 border-slate-200",
  "Data and Analytics": "bg-stone-50 text-stone-700 border-stone-200",
};

export function Solutions() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-24">
        {solutions.map((solution, index) => (
          <div
            key={`solution-${index}`}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className={index % 2 === 1 ? "lg:order-2" : ""}>
              <p className="text-sm text-[#7c7c7c] mb-2">
                {solution.subtitle}
              </p>
              <h3 className="text-4xl md:text-5xl font-semibold text-[#252d2e] mb-6">
                {solution.title}
              </h3>
              <h4 className="text-xl font-medium text-[#252d2e] mb-4">
                {solution.heading}
              </h4>
              <p className="text-[#7c7c7c] mb-6 leading-relaxed">
                {solution.description}
              </p>
              <Link
                href={solution.link}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#748484] hover:text-[#252d2e] transition-colors mb-6"
              >
                Read more
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
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[#7c7c7c] mr-2">Products:</span>
                {solution.products.map((product, productIndex) => (
                  <span
                    key={`${solution.title}-product-${productIndex}`}
                    className={`${styles.productTag} ${productColors[product]}`}
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>
            <div
              className={`relative overflow-hidden rounded-2xl h-80 bg-gradient-to-br from-gray-50 to-gray-100 ${
                index % 2 === 1 ? "lg:order-1" : ""
              }`}
            >
              <Image
                src={solution.image}
                alt={`${solution.title} preview`}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority={index === 0}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
