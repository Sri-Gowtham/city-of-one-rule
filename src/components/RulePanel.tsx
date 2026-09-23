import { RuleDef } from "../engine/types";
import "./RulePanel.css";

interface Props {
  choices: RuleDef[];
  onChoose: (rule: RuleDef) => void;
  disabled: boolean;
}

export function RulePanel({ choices, onChoose, disabled }: Props) {
  return (
    <footer className="rule-panel">
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
