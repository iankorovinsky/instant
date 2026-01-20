import styles from "./home.module.css";

const products = [
  {
    name: "PMS",
    description: "Portfolio management and optimization",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    name: "OMS",
    description: "Order management embedded with traders",
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    name: "EMS",
    description: "No touch to high touch execution management",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    name: "Portfolio Accounting",
    description: "Real-time accounting and reconciliation",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    name: "Risk and Compliance",
    description: "Custom permissions, pre-trade controls, and best-ex",
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    name: "Data and Analytics",
    description: "Real-time pricing, reference data, and portfolio analytics",
    color: "bg-stone-50 text-stone-700 border-stone-200",
  },
];

export function Products() {
  return (
    <section className="py-24 bg-[#fbfbfb]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-[#252d2e] mb-4">
          World-class products.
        </h2>
        <p className="text-xl text-center text-[#7c7c7c] mb-16">
          Modular by design, unified by choice.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product, index) => (
            <div
              key={`product-${index}`}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <span className={`${styles.productTag} ${product.color}`}>
                {product.name}
              </span>
              <p className="text-xs text-[#7c7c7c] leading-relaxed mt-3">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
