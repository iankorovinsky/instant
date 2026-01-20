export function Stats() {
  const stats = [
    {
      value: "$8T+",
      label: "Assets held by our clients",
    },
    {
      value: "4M+",
      label: "Orders processed through our platform",
    },
    {
      value: "<1s",
      label: "Median time to execute an order",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-[#252d2e] mb-16">
          The investment management operating system designed to scale
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, index) => (
            <div key={`stat-${index}`} className="text-center">
              <div className="text-5xl md:text-6xl font-semibold text-[#252d2e] mb-3">
                {stat.value}
              </div>
              <p className="text-sm text-[#7c7c7c]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
