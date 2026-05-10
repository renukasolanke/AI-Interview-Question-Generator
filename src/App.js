import React, { useState, useEffect } from "react";
import Login, { TOKEN_KEY } from "./Login";
import "./style.css";

const API_BASE = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [field, setField] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState("Easy");
  const [type, setType] = useState("MCQ");
  const [topicGroup, setTopicGroup] = useState("DSA");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("English");
  const [company, setCompany] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [autoRevealCountdown, setAutoRevealCountdown] = useState(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [simulationQuestions, setSimulationQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const [bookmarks, setBookmarks] = useState([]);
  const [apiError, setApiError] = useState("");
  const [stats, setStats] = useState({
    attempted: 0,
    correct: 0,
  });
  const [resumeText, setResumeText] = useState("");
  const [resumeQuestions, setResumeQuestions] = useState([]);
  const [quizMode, setQuizMode] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [quizSummary, setQuizSummary] = useState({
    totalCorrect: 0,
    totalIncorrect: 0,
    topicStats: {},
  });
  const [quizDashboard, setQuizDashboard] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    topicAccuracy: {},
    weakTopics: [],
  });

  const isLoggedIn = !!user;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem(TOKEN_KEY);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.user) setUser(data.user);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY));
  }, []);

  /* Auto-show answer after 10 seconds – countdown 10, 9, 8... */
  useEffect(() => {
    if (!currentQuestion) {
      setAutoRevealCountdown(null);
      return;
    }
    setAutoRevealCountdown(10);
    const iv = setInterval(() => {
      setAutoRevealCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(iv);
          setAnswerVisible(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [currentQuestion]);

  const handleLogout = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      localStorage.removeItem(TOKEN_KEY);
    }
    setUser(null);
    setCurrentQuestion(null);
    setSimulationMode(false);
  };

  const topicsByGroup = {
    DSA: ["Arrays", "Trees", "Graphs"],
    DBMS: ["Normalization", "Transactions"],
    OS: ["Scheduling", "Deadlocks"],
    Java: ["OOP", "Multithreading"],
    Basics: ["Authentication"],
    JavaScript: ["Async"],
    "HR / Behavioral": ["Self Introduction", "Strengths", "Weaknesses"],
  };

  const handleGenerateQuestion = async () => {
    setFeedback("");
    setAnswerVisible(false);
    setApiError("");

    try {
      const params = new URLSearchParams({
        field,
        difficulty,
        type,
        topicGroup,
        language,
      });

      if (topic) params.append("topic", topic);
      if (company) params.append("company", company);

      const res = await fetch(
        `http://localhost:5000/api/question?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      if (data && data.question) {
        setCurrentQuestion(data.question);
        setUserAnswer("");
      } else {
        setCurrentQuestion(null);
      }
    } catch (err) {
      console.error(err);
      setApiError(
        "Unable to reach question server. Please check if the backend (node server.js) is running on http://localhost:5000."
      );
      setCurrentQuestion(null);
    }
  };

  const handleGenerateCodingQuestion = async () => {
    setFeedback("");
    setAnswerVisible(false);
    setApiError("");

    try {
      const params = new URLSearchParams({
        field,
        difficulty,
        topicGroup,
        language,
      });

      const res = await fetch(
        `http://localhost:5000/api/coding-question?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      if (data && data.question) {
        setCurrentQuestion(data.question);
        setUserAnswer("");
        setType("Coding");
      } else {
        setCurrentQuestion(null);
      }
    } catch (err) {
      console.error(err);
      setApiError(
        "Unable to reach coding question server. Please ensure backend is running."
      );
      setCurrentQuestion(null);
    }
  };

  const handleSimulationStart = async () => {
    setFeedback("");
    setAnswerVisible(false);
    setApiError("");
    setSimulationMode(true);
    setQuizMode(type === "MCQ");
    setQuizCompleted(false);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);

    try {
      const params = new URLSearchParams({
        field,
        difficulty,
        type,
        topicGroup,
        language,
        mode: "list",
      });

      const res = await fetch(
        `http://localhost:5000/api/question?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setSimulationQuestions(data.questions);
        setCurrentQuestion(data.questions[0]);
      } else {
        setSimulationQuestions([]);
        setCurrentQuestion(null);
        setSimulationMode(false);
      }
    } catch (err) {
      console.error(err);
      setApiError(
        "Failed to start simulation. Backend might be offline (start it with: cd server && node server.js)."
      );
      setSimulationMode(false);
      setCurrentQuestion(null);
    }
  };

  const handleNextSimulationQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < simulationQuestions.length) {
      setCurrentIndex(nextIndex);
      setCurrentQuestion(simulationQuestions[nextIndex]);
      setUserAnswer("");
      setFeedback("");
      setAnswerVisible(false);
      setSelectedOptionIndex(null);
    } else {
      setSimulationMode(false);
      setQuizCompleted(true);
      setCurrentQuestion(null);
    }
  };

  const handleMcqSelect = (index) => {
    if (!currentQuestion || !Array.isArray(currentQuestion.options)) return;
    if (selectedOptionIndex !== null) return;

    setSelectedOptionIndex(index);

    const isCorrect = index === currentQuestion.correctOptionIndex;
    const topicKey = currentQuestion.topic || "General";

    setQuizSummary((prev) => {
      const nextTopicStats = { ...prev.topicStats };
      const existing = nextTopicStats[topicKey] || { correct: 0, total: 0 };
      return {
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        totalIncorrect: prev.totalIncorrect + (isCorrect ? 0 : 1),
        topicStats: {
          ...nextTopicStats,
          [topicKey]: {
            correct: existing.correct + (isCorrect ? 1 : 0),
            total: existing.total + 1,
          },
        },
      };
    });
  };

  const totalQuizQuestions = simulationQuestions.length;
  const quizProgressPercent =
    totalQuizQuestions === 0
      ? 0
      : Math.round(((currentIndex + 1) / totalQuizQuestions) * 100);

  const submitQuizToBackend = async (summary) => {
    try {
      await fetch("http://localhost:5000/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.username || user?.email || "guest",
          summary: {
            ...summary,
            totalQuestions: summary.totalCorrect + summary.totalIncorrect,
          },
        }),
      });

      const res = await fetch(
        `http://localhost:5000/api/quiz/stats?userId=${
          user?.username || user?.email || "guest"
        }`
      );
      if (res.ok) {
        const data = await res.json();
        setQuizDashboard(data);
      }
    } catch (err) {
      console.error("Failed to submit quiz stats:", err);
    }
  };

  const handleBookmark = () => {
    if (!currentQuestion) return;

    const exists = bookmarks.find((b) => b.id === currentQuestion.id);
    if (exists) return;

    setBookmarks([...bookmarks, currentQuestion]);
  };

  const handleEvaluateAnswer = () => {
    if (!currentQuestion || !userAnswer.trim()) {
      setFeedback("Type your answer first.");
      return;
    }

    setApiError("");

    fetch("http://localhost:5000/api/ai/evaluate-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: currentQuestion.question,
        correctAnswer: currentQuestion.answer,
        userAnswer,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("AI evaluation failed");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.feedback) {
          setFeedback(data.feedback);
        }
      })
      .catch(() => {
        let scoreHint =
          "Good attempt. You can refine your structure and add clearer points.";

        if (currentQuestion.answer) {
          const keyWords = currentQuestion.answer
            .split(/[,.]/)
            .map((p) => p.trim().toLowerCase())
            .filter((p) => p.length > 3);

          const answerText = userAnswer.toLowerCase();
          const matched = keyWords.filter((k) =>
            answerText.includes(k)
          ).length;

          if (matched === 0) {
            scoreHint =
              "Your answer misses key points. Try to cover the main definition and 2–3 important aspects.";
          } else if (matched < 3) {
            scoreHint =
              "Decent answer. Add more key points and examples to make it stronger.";
          } else {
            scoreHint =
              "Strong answer. You have covered many important points. You can still polish language and examples.";
          }
        }

        setFeedback(
          `${scoreHint} Tip: start with a one-line definition, then 2–3 bullet points, and finally a short example.`
        );
      })
      .finally(() => {
        setStats((prev) => ({
          attempted: prev.attempted + 1,
          correct: prev.correct,
        }));
      });
  };

  const handleGenerateAiQuestion = async () => {
    setFeedback("");
    setAnswerVisible(false);
    setApiError("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/ai/generate-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field,
            difficulty,
            type,
            topicGroup,
            topic,
            company,
            language,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("AI question API failed");
      }

      const data = await res.json();
      if (data && data.question) {
        setCurrentQuestion(data.question);
        setUserAnswer("");
      } else {
        setCurrentQuestion(null);
      }
    } catch (err) {
      console.error(err);
      setApiError(
        "AI question generation failed. You can still use normal 'Generate Question'."
      );
    }
  };

  const handleResumeQuestions = async () => {
    if (!resumeText.trim()) {
      setApiError("Paste your resume text or summary first.");
      return;
    }

    setApiError("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/ai/resume-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeText,
            language,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Resume question API failed");
      }

      const data = await res.json();
      if (data && Array.isArray(data.questions)) {
        setResumeQuestions(data.questions);
      } else {
        setResumeQuestions([]);
      }
    } catch (err) {
      console.error(err);
      setApiError(
        "Failed to generate resume-based questions. Check backend / OpenAI config."
      );
    }
  };

  const accuracy =
    stats.attempted === 0
      ? 0
      : Math.round((stats.correct / stats.attempted) * 100);

  if (!isLoggedIn) {
    return <Login setUser={setUser} />;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1 className="top-title">Interview Question Generator</h1>
          <p className="top-subtitle">
            Smart practice for placements, coding and HR rounds.
          </p>
        </div>
        <div className="user-pill">
          <span className="user-name">
            {user.username || user.email || "Candidate"}
          </span>
          <button className="small-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="filter-panel glass-card">
          <h2 className="panel-title">Filters</h2>

          <label className="field-label">Field / Domain</label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
          >
            <option>Computer Science</option>
            <option>Web Development</option>
            <option>Data Science</option>
            <option>AI/ML</option>
            <option>Cyber Security</option>
            <option>Aptitude & HR</option>
          </select>

          <label className="field-label">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <label className="field-label">Question Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="MCQ">MCQs</option>
            <option value="Short">Short Answer</option>
            <option value="Coding">Coding Questions</option>
            <option value="Scenario">Scenario-based</option>
            <option value="HR">HR / Behavioral</option>
          </select>

          <label className="field-label">Topic Group</label>
          <select
            value={topicGroup}
            onChange={(e) => {
              setTopicGroup(e.target.value);
              setTopic("");
            }}
          >
            <option value="DSA">DSA</option>
            <option value="DBMS">DBMS</option>
            <option value="OS">OS</option>
            <option value="Java">Java</option>
            <option value="Basics">Basics (Cyber Security)</option>
            <option value="JavaScript">JavaScript</option>
            <option value="HR / Behavioral">HR / Behavioral</option>
          </select>

          <label className="field-label">Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="">Any</option>
            {(topicsByGroup[topicGroup] || []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label className="field-label">Company (optional)</label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          >
            <option value="">Any</option>
            <option value="TCS">Tata Consultancy Services</option>
            <option value="Infosys">Infosys</option>
            <option value="Google">Google</option>
            <option value="Amazon">Amazon</option>
          </select>

          <label className="field-label">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Marathi">Marathi</option>
          </select>

          <div className="filter-actions">
            <button
              className="generate-btn"
              type="button"
              onClick={
                type === "Coding"
                  ? handleGenerateCodingQuestion
                  : handleGenerateQuestion
              }
            >
              Generate Question
            </button>

            <button
              className="outline-btn"
              type="button"
              onClick={handleSimulationStart}
            >
              Start Interview Simulation
            </button>
          </div>

          <div className="timer-section">
            <label className="field-label">
              Question Timer (seconds)
            </label>
            <input
              type="number"
              min="30"
              max="900"
              value={timerSeconds}
              onChange={(e) =>
                setTimerSeconds(Number(e.target.value || 0))
              }
            />
            <p className="hint-text">
              Use this as a self-timer while answering.
            </p>
          </div>
        </aside>

        <section className="content-panel">
            <div className="glass-card question-card">
            <div className="question-header">
                <h2>Current Question</h2>
                {simulationMode && (
                  <span className="badge">
                    {quizMode ? "MCQ Quiz" : "Simulation"}{" "}
                    {simulationQuestions.length > 0 && !quizCompleted
                      ? `${currentIndex + 1}/${simulationQuestions.length}`
                      : ""}
                  </span>
                )}
            </div>

            {apiError && (
              <p className="hint-text" style={{ color: "#f97373" }}>
                {apiError}
              </p>
            )}

            {!currentQuestion && (
              <p className="hint-text">
                Choose filters on the left and click{" "}
                <strong>Generate Question</strong> or{" "}
                <strong>Start Interview Simulation</strong>.
              </p>
            )}

            {currentQuestion && (
              <>
                <div className="question-meta">
                  <span>{currentQuestion.field}</span>
                  <span>{currentQuestion.difficulty}</span>
                  <span>{currentQuestion.type}</span>
                  {currentQuestion.topic && (
                    <span>{currentQuestion.topic}</span>
                  )}
                </div>

                <h3 className="question-text">
                  {currentQuestion.question}
                </h3>

                {Array.isArray(currentQuestion.options) &&
                  currentQuestion.options.length > 0 && (
                    <>
                      {quizMode && totalQuizQuestions > 0 && (
                        <div className="quiz-progress">
                          <div
                            className="quiz-progress-bar"
                            style={{ width: `${quizProgressPercent}%` }}
                          />
                        </div>
                      )}
                      <ul className="options-list">
                        {currentQuestion.options.map((opt, index) => {
                          const isSelected = index === selectedOptionIndex;
                          const isCorrect =
                            index === currentQuestion.correctOptionIndex;
                          let optionClass = "mcq-option";

                          if (selectedOptionIndex !== null) {
                            if (isSelected && isCorrect) {
                              optionClass += " mcq-correct";
                            } else if (isSelected && !isCorrect) {
                              optionClass += " mcq-wrong";
                            } else if (isCorrect) {
                              optionClass += " mcq-correct-soft";
                            }
                          }

                          return (
                            <li
                              key={opt}
                              className={optionClass}
                              onClick={() =>
                                quizMode
                                  ? handleMcqSelect(index)
                                  : undefined
                              }
                            >
                              <span className="option-index">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <span>{opt}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}

                {currentQuestion.coding && (
                  <div className="coding-block">
                    <p className="coding-title">
                      Problem Statement:
                    </p>
                    <p>{currentQuestion.coding.problemStatement}</p>
                    <p className="coding-title">Sample I/O:</p>
                    <p>{currentQuestion.coding.sampleInput}</p>
                    <p>{currentQuestion.coding.sampleOutput}</p>
                    <p className="coding-title">Constraints:</p>
                    <p>{currentQuestion.coding.constraints}</p>
                    <p className="coding-title">Test Cases:</p>
                    <ul>
                      {currentQuestion.coding.testCases.map((tc) => (
                        <li key={tc.input}>
                          <strong>Input:</strong> {tc.input}{" "}
                          <strong>Output:</strong> {tc.output}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="answer-section">
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={() =>
                      setAnswerVisible((prev) => !prev)
                    }
                  >
                    {answerVisible
                      ? "Hide Answer & Explanation"
                      : "Show Answer & Explanation"}
                  </button>
                  {!answerVisible && autoRevealCountdown != null && autoRevealCountdown > 0 && (
                    <p className="hint-text" style={{ marginTop: 6 }}>
                      Answer will auto-reveal in{" "}
                      <strong style={{ color: "#22d3ee" }}>{autoRevealCountdown}</strong>{" "}
                      second{autoRevealCountdown !== 1 ? "s" : ""}.
                    </p>
                  )}

                  {answerVisible && (
                    <div className="answer-box">
                      {currentQuestion.answer && (
                        <>
                          <p className="answer-title">Answer</p>
                          <p>{currentQuestion.answer}</p>
                        </>
                      )}
                      {currentQuestion.explanation && (
                        <>
                          <p className="answer-title">Explanation</p>
                          <p>{currentQuestion.explanation}</p>
                        </>
                      )}
                      {Array.isArray(currentQuestion.bookReferences) &&
                        currentQuestion.bookReferences.length > 0 && (
                          <div className="book-refs">
                            <p className="answer-title">📚 Book References</p>
                            <ul className="book-ref-list">
                              {currentQuestion.bookReferences.map((book, i) => (
                                <li key={i}>{book}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="practice-section">
                  <p className="field-label">
                    Type your answer (for AI-style feedback)
                  </p>
                  <textarea
                    className="answer-input"
                    rows={4}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Write your answer here as if you are in a real interview..."
                  />
                  <div className="practice-actions">
                    <button
                      type="button"
                      className="generate-btn"
                      onClick={handleEvaluateAnswer}
                    >
                      Get Feedback
                    </button>
                    <button
                      type="button"
                      className="outline-btn"
                      onClick={handleBookmark}
                    >
                      Bookmark Question
                    </button>
                    {simulationMode && !quizMode && (
                      <button
                        type="button"
                        className="outline-btn"
                        onClick={handleNextSimulationQuestion}
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                  {feedback && (
                    <div className="feedback-box">{feedback}</div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bottom-row">
            <div className="glass-card stats-card">
              <h3>Performance Dashboard</h3>
              <p>
                <strong>Attempted (QA feedback):</strong> {stats.attempted}
              </p>
              <p>
                <strong>Accuracy (approx):</strong> {accuracy}%
              </p>
              {quizCompleted && (
                <>
                  <p>
                    <strong>Last MCQ Quiz:</strong>{" "}
                    {quizSummary.totalCorrect}/
                    {quizSummary.totalCorrect + quizSummary.totalIncorrect}{" "}
                    correct (
                    {quizSummary.totalCorrect +
                      quizSummary.totalIncorrect >
                    0
                      ? Math.round(
                          (quizSummary.totalCorrect /
                            (quizSummary.totalCorrect +
                              quizSummary.totalIncorrect)) *
                            100
                        )
                      : 0}
                    %)
                  </p>
                  <p className="hint-text">
                    Great! Review explanations for questions you got wrong.
                  </p>
                </>
              )}
              {quizDashboard.totalQuizzes > 0 && (
                <>
                  <p>
                    <strong>Total Quizzes:</strong>{" "}
                    {quizDashboard.totalQuizzes}
                  </p>
                  <p>
                    <strong>Average Score:</strong>{" "}
                    {quizDashboard.averageScore}%
                  </p>
                  <div className="topic-accuracy-row">
                    {Object.entries(
                      quizDashboard.topicAccuracy || {}
                    ).map(([topicName, acc]) => (
                      <span
                        key={topicName}
                        className={`topic-chip ${
                          acc < 50
                            ? "topic-chip-weak"
                            : acc < 75
                            ? "topic-chip-medium"
                            : "topic-chip-strong"
                        }`}
                      >
                        {topicName}: {acc}%
                      </span>
                    ))}
                  </div>
                  <p className="hint-text">
                    Weak topics:{" "}
                    {quizDashboard.weakTopics.length > 0
                      ? quizDashboard.weakTopics.join(", ")
                      : "none so far"}
                  </p>
                </>
              )}
              <button
                type="button"
                className="outline-btn"
                onClick={handleGenerateAiQuestion}
              >
                Generate AI Question
              </button>
            </div>

            <div className="glass-card bookmark-card">
              <h3>Bookmarked Questions</h3>
              {bookmarks.length === 0 && (
                <p className="hint-text">
                  Bookmark important or tricky questions to revise
                  later.
                </p>
              )}
              {bookmarks.length > 0 && (
                <ul className="bookmark-list">
                  {bookmarks.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => {
                          setCurrentQuestion(b);
                          setSimulationMode(false);
                        }}
                      >
                        {b.question}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: "12px" }}>
                <p className="field-label">
                  Resume-based Questions (paste resume text)
                </p>
                <textarea
                  className="answer-input"
                  rows={3}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume summary or project details here..."
                />
                <button
                  type="button"
                  className="outline-btn"
                  onClick={handleResumeQuestions}
                >
                  Generate Resume Questions
                </button>
                {resumeQuestions.length > 0 && (
                  <ul className="bookmark-list" style={{ marginTop: "8px" }}>
                    {resumeQuestions.map((rq, index) => (
                      <li key={`${rq.question}-${index}`}>
                        <span className="hint-text">
                          [{rq.type || "General"}]
                        </span>{" "}
                        {rq.question}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;