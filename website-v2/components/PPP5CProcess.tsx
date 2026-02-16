const steps = [
  {
    number: "01",
    name: "Clarify",
    tag: "PPP Review/Audit",
    description:
      "Map what you own, where value leaks, what's trustworthy and portable.",
    color: "from-ow-blue to-ow-blue-dark",
  },
  {
    number: "02",
    name: "Connect",
    tag: "",
    description:
      "Create a resilient digital backbone that links systems, platforms, and devices.",
    color: "from-ow-blue-light to-ow-blue",
  },
  {
    number: "03",
    name: "Collect",
    tag: "",
    description:
      "Aggregate high-fidelity usable data from across the property.",
    color: "from-ow-accent to-ow-blue-light",
  },
  {
    number: "04",
    name: "Coordinate",
    tag: "",
    description:
      "Align vendors and workflows so operations become predictable.",
    color: "from-teal-500 to-ow-accent",
  },
  {
    number: "05",
    name: "Control",
    tag: "",
    description:
      "Reclaim ownership of your data & digital infrastructure and stay platform-flexible.",
    color: "from-ow-green to-teal-500",
  },
];

export function PPP5CProcess() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {steps.map((step) => (
        <div key={step.number} className="ow-card ow-card-hover group text-center">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-lg font-bold mx-auto mb-4 group-hover:scale-110 transition-transform`}
          >
            {step.number}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {step.name}
          </h3>
          {step.tag && (
            <span className="text-xs text-ow-blue font-medium">
              ({step.tag})
            </span>
          )}
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}
