import type { RuleDef } from "../engine/types";
import "./RulePanel.css";

export type ViewTab = "city" | "people" | "businesses" | "news";

interface Props {
  choices: RuleDef[];
  onChoose: (rule: RuleDef) => void;
  disabled: boolean;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const tabs: { id: ViewTab; label: string }[] = [
  { id: "city", label: "City" },
  { id: "people", label: "People" },
  { id: "businesses", label: "Businesses" },
  { id: "news", label: "News" },
];

export function RulePanel({ choices, onChoose, disabled, activeTab, onTabChange }: Props) {
  return (
    <footer className="rule-panel">
      <div className="rule-panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeTab ? "active" : ""}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rule-panel-heading">Choose your next rule</div>
      <div className="rule-cards">
        {choices.map((rule) => (
          <button
            key={rule.id}
            className="rule-card"
            disabled={disabled}
            onClick={() => onChoose(rule)}
          >
            <span className="rule-card-name">{rule.name}</span>
            <span className="rule-card-desc">{rule.description}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
