import type { EraRecord } from "../engine/types";
import "./NewsHistoryPanel.css";

interface Props {
  history: EraRecord[];
}

export function NewsHistoryPanel({ history }: Props) {
  return (
    <div className="news-history-panel">
      <h2>City Chronicle</h2>
      {history.length === 0 && <p className="news-history-empty">No editions published yet.</p>}
      <div className="news-history-list">
        {[...history].reverse().map((record) => (
          <article className="news-history-item" key={record.era}>
            <div className="news-history-masthead">DAY {String(record.era).padStart(2, "0")}</div>
            <h3>{record.headline}</h3>
            <p>{record.reaction}</p>
            <span className="news-history-rule">Rule enacted: {record.ruleName}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
