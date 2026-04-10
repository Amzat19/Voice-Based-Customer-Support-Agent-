const CAPABILITIES = [
  'Onboarding',
  'Pricing & Fees',
  'Payout Timelines',
  'Invoices',
  'Compliance',
];

export default function CapabilityChips() {
  return (
    <div className="capability-container">
      {CAPABILITIES.map((cap) => (
        <span key={cap} className="capability-chip">
          <span className="chip-dot"></span>
          {cap}
        </span>
      ))}
    </div>
  );
}
