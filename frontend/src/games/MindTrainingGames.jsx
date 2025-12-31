import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

const TOTAL_ROUNDS = 10;
const ROUND_TIME = 5;

const MindTrainingGames = ({ onBack }) => {
  const [gameState, setGameState] = useState("menu");
  const [targetShape, setTargetShape] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [isCorrect, setIsCorrect] = useState(null);
  const [history, setHistory] = useState([]);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const shapes = [
    { id: "circle", name: "Circle", color: "bg-red-500", style: "rounded-full" },
    { id: "square", name: "Square", color: "bg-blue-500", style: "rounded-lg" },
    { id: "triangle", name: "Triangle", color: "bg-green-500", style: "rounded-full" },
  ];

  const startGame = () => {
    setTargetShape(shapes[Math.floor(Math.random() * shapes.length)]);
    setGameState("playing");
    setTimeLeft(ROUND_TIME);
    setIsCorrect(null);
  };

  const finishGame = async (finalHistory, finalScore) => {
    await fetch(`${API}/api/games/mind-training/result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify({
        score: finalScore,
        rounds: TOTAL_ROUNDS,
        details: finalHistory,
      }),
    });

    setGameState("menu");
    setRound(1);
    setHistory([]);
  };

  const handleShapeClick = (shape) => {
    const correct = shape.id === targetShape.id;
    const gained = correct ? 10 : 0;

    const roundData = {
      round,
      target: targetShape.id,
      selected: shape.id,
      correct,
      timeTaken: ROUND_TIME - timeLeft,
    };

    const updatedHistory = [...history, roundData];
    const updatedScore = score + gained;

    setHistory(updatedHistory);
    setScore(updatedScore);
    setIsCorrect(correct);
    setGameState("result");

    setTimeout(() => {
      if (round < TOTAL_ROUNDS) {
        setRound(round + 1);
        startGame();
      } else {
        finishGame(updatedHistory, updatedScore);
      }
    }, 1500);
  };

  const resetGame = () => {
    setGameState("menu");
    setScore(0);
    setRound(1);
    setTimeLeft(ROUND_TIME);
    setIsCorrect(null);
    setHistory([]);
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    if (timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(t);
    }

    // ⏱ TIMEOUT ROUND
    const roundData = {
      round,
      target: targetShape.id,
      selected: null,
      correct: false,
      timeTaken: ROUND_TIME,
    };

    const updatedHistory = [...history, roundData];
    setHistory(updatedHistory);
    setIsCorrect(false);
    setGameState("result");

    setTimeout(() => {
      if (round < TOTAL_ROUNDS) {
        setRound(round + 1);
        startGame();
      } else {
        finishGame(updatedHistory, score);
      }
    }, 1500);
  }, [timeLeft, gameState]);

  /* ---------- UI (UNCHANGED) ---------- */
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">MIND Training Games</h2>

      {gameState === "menu" && (
        <button onClick={startGame} className="px-6 py-3 bg-green-500 text-white rounded">
          <Play className="inline w-4 h-4 mr-2" /> Start Training
        </button>
      )}

      {gameState === "playing" && (
        <>
          <div className="flex justify-between mb-4">
            <span>Round {round}/10</span>
            <span>{timeLeft}s</span>
            <span>Score: {score}</span>
          </div>
          <h3 className="mb-4">Click the {targetShape?.name}</h3>
          <div className="flex gap-6 justify-center">
            {shapes.map((s) => (
              <button
                key={s.id}
                onClick={() => handleShapeClick(s)}
                className={`w-24 h-24 ${s.color} ${s.style} border-4`}
              />
            ))}
          </div>
        </>
      )}

      {gameState === "result" && (
        isCorrect ? <CheckCircle className="mx-auto text-green-500 w-16 h-16" />
                  : <XCircle className="mx-auto text-red-500 w-16 h-16" />
      )}

      <button onClick={resetGame} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
        <RotateCcw className="inline w-4 h-4 mr-2" /> Reset
      </button>
    </div>
  );
};

export default MindTrainingGames;
