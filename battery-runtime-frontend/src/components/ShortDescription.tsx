import { FC, useState } from "react";

const MAX_LENGTH = 60;

// Краткое описание, обрезанное до «Ещё»; по нажатию раскрывается целиком
export const ShortDescription: FC<{ text: string | null }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  if (expanded || text.length <= MAX_LENGTH) {
    return <div className="feedDesc">{text}</div>;
  }
  return (
    <div className="feedDesc">
      {text.slice(0, MAX_LENGTH).trimEnd()}…{" "}
      <button type="button" className="feedMore" onClick={() => setExpanded(true)}>
        Ещё
      </button>
    </div>
  );
};
