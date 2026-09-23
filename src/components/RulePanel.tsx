import "./RulePanel.css";

export function RulePanel() {
  return (
    <footer className="rule-panel">
      <div className="rule-panel-tabs">
        <button>CITY</button>
        <button>PEOPLE</button>
        <button>BUSINESSES</button>
        <button>NEWS</button>
      </div>
      <button className="rule-panel-cta" disabled>
        CHOOSE NEXT RULE
      </button>
    </footer>
  );
}
