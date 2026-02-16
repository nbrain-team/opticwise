export function TwoLayerModel() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Layer 1 */}
      <div className="ow-card border-ow-blue/20 bg-blue-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="ow-icon-box">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ow-blue">Layer 1</span>
            <h3 className="text-lg font-bold text-gray-900">Managed Data &amp; Digital Infrastructure</h3>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          OpticWise provides managed services that include design, implementation, and operation across facilities and portfolios&mdash;keeping performance high and operational risk low without burdening on-site teams.
        </p>
        <ul className="space-y-2">
          {["Repeatable standards across properties", "Segmented access and documented governance", "Reliable operations so performance stays high"].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-ow-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Layer 2 */}
      <div className="ow-card border-ow-blue/20 bg-blue-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="ow-icon-box" style={{ background: "linear-gradient(135deg, #10B981, #0EA571)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ow-green">Layer 2</span>
            <h3 className="text-lg font-bold text-gray-900">Owner-Controlled Intelligence Layer</h3>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          A vendor- and LLM-agnostic <strong className="text-gray-900">Property Intelligence Layer</strong>: a governed data plane + trust plane that makes each property capable of autonomous activities and intelligence.
        </p>
        <ul className="space-y-2">
          {["One standard intelligence substrate", "Many decision engines (any vendor, any LLM)", "Portfolio compounding: Property Intelligence → Portfolio Intelligence"].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-ow-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
