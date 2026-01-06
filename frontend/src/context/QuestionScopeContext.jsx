import React, { createContext, useContext, useState } from "react";

const QuestionScopeContext = createContext(null);

export function QuestionScopeProvider({ children }) {
  const [scope, setScope] = useState({
    board: "",
    class: "",
    subject: "",
    topic: "",
    stage: "",
    difficulty: "",
    questionType: "",
  });

  const value = {
    scope,
    setBoard: (b) => setScope((prev) => ({ ...prev, board: b })),
    setClass: (c) => setScope((prev) => ({ ...prev, class: c })),
    setSubject: (s) => setScope((prev) => ({ ...prev, subject: s })),
    setTopic: (t) => setScope((prev) => ({ ...prev, topic: t })),
    setStage: (st) => setScope((prev) => ({ ...prev, stage: st })),
    setDifficulty: (d) => setScope((prev) => ({ ...prev, difficulty: d })),
    setQuestionType: (qt) => setScope((prev) => ({ ...prev, questionType: qt })),
    clear: () => setScope({
      board: "",
      class: "",
      subject: "",
      topic: "",
      stage: "",
      difficulty: "",
      questionType: ""
    }),
  };

  return (
    <QuestionScopeContext.Provider value={value}>
      {children}
    </QuestionScopeContext.Provider>
  );
}

export function useQuestionScope() {
  const ctx = useContext(QuestionScopeContext);
  if (!ctx) throw new Error("useQuestionScope must be used inside QuestionScopeProvider");
  return ctx;
}
