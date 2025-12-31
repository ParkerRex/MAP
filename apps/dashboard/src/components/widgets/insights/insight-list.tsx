"use client";

const chatExamples = [
  "What's on my calendar today?",
  "Show me my tasks",
  "What are my notes?",
  "Help me organize my day",
];

export function InsightList() {
  return (
    <div className="mt-12">
      <ul className="flex flex-col justify-center items-center space-y-3 flex-shrink">
        {chatExamples.map((example) => (
          <li
            key={example}
            className="rounded-full dark:bg-secondary bg-[#F2F1EF] text-xs font-mono text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button
              onClick={() => console.log("TODO:", example)}
              type="button"
              className="inline-block p-3 py-2"
            >
              <span>{example}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
