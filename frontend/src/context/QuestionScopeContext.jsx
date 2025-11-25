import React, { createContext, useContext, useState } from "react";

const QuestionScopeContext = createContext(null);

export function QuestionScopeProvider({ children }) {
  const [scope, setScope] = useState({
    subject: "",
    topic: "",
  });
  const value = {
    scope,
    setSubject: (s) => setScope((prev) => ({ ...prev, subject: s })),
    setTopic:   (t) => setScope((prev) => ({ ...prev, topic: t })),
    clear:      ()  => setScope({ subject: "", topic: "" }),
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
