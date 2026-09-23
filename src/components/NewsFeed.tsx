import type { EraRecord } from "../engine/types";
import "./NewsFeed.css";

interface Props {
  record: EraRecord | null;
}

export function NewsFeed({ record }: Props) {
  if (!record) {
    return (
      <aside className="news-feed news-feed-empty">
        <p>Choose a rule below to see how the city reacts.</p>
      </aside>
    );
  }

  return (
    <aside className="news-feed">
      <div className="news-feed-masthead">CITY CHRONICLE — DAY {String(record.era).padStart(2, "0")}</div>
      <h2 className="news-feed-headline">{record.headline}</h2>
      <p className="news-feed-body">{record.reaction}</p>
      <p className="news-feed-rule">Rule enacted: {record.ruleName}</p>
    </aside>
  );
}
