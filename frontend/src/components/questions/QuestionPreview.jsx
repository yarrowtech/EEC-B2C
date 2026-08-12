import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function QuestionPreview({ question, index }) {
  const options = Array.isArray(question.options) ? question.options : [];
  const correct = Array.isArray(question.correct) ? question.correct : [];
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px] uppercase">{question.type}</Badge>
        <span className="font-medium">Q{index + 1}. {question.question}</span>
      </div>
      {options.length > 0 && (
        <ul className="ml-4 space-y-0.5 text-xs">
          {options.map((opt, i) => {
            const letter = ["A", "B", "C", "D"][i];
            const isCorrect = correct.includes(letter);
            return (
              <li key={letter} className={cn(isCorrect && "font-semibold text-emerald-700")}>
                {letter}. {opt.text || opt} {isCorrect && "✓"}
              </li>
            );
          })}
        </ul>
      )}
      {question.type === "true-false" && (
        <p className="ml-4 text-xs font-semibold text-emerald-700">Answer: {correct[0]}</p>
      )}
    </div>
  );
}
