import { useState, useEffect } from 'react';
import './App.css';

type Flashcard = {
  question: string;
  answer: string;
  options: string[];
  hint: string;
};

type SubjectData = {
  name: string;
  flashcards: Flashcard[];
};

type SubjectsMap = {
  [key: string]: SubjectData;
};

type Mode = 'flashcards' | 'learn' | 'test' | 'match';

function App() {
  const [subjects, setSubjects] = useState<SubjectsMap>({});
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<Mode>('flashcards');
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (!savedUserId) {
      const newId = 'user-' + Date.now();
      localStorage.setItem('userId', newId);
    }
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/subjects')
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        const userId = localStorage.getItem('userId');
        fetch(`http://localhost:5000/api/progress?userId=${userId}`)
          .then(res => res.json())
          .then(progress => {
            if (progress && progress.subject && data[progress.subject]) {
              setCurrentSubject(progress.subject);
              setCurrentCardIndex(progress.cardIndex);
              setScore(progress.score);
            }
          });
      })
      .catch(err => console.error('Ошибка загрузки:', err));
  }, []);

  const selectSubject = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentMode('flashcards');
    resetCardState();
  };

  const resetCardState = () => {
    setIsFlipped(false);
    setSelectedOption(null);
    setShowResult(false);
    setCurrentCardIndex(0);
    setScore(0);
  };

  const changeMode = (mode: Mode) => {
    setCurrentMode(mode);
    resetCardState();
  };

  const currentFlashcard = currentSubject && subjects[currentSubject]
    ? subjects[currentSubject].flashcards[currentCardIndex]
    : null;

  const checkAnswer = (option: string) => {
    setSelectedOption(option);
    setShowResult(true);
    if (option === currentFlashcard?.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const nextCard = () => {
    if (
      currentSubject &&
      currentCardIndex < subjects[currentSubject].flashcards.length - 1
    ) {
      const userId = localStorage.getItem('userId');
      const newIndex = currentCardIndex + 1;

      fetch('http://localhost:5000/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subject: currentSubject,
          cardIndex: newIndex,
          score
        })
      });

      setCurrentCardIndex(newIndex);
      resetCardState();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Учебные флешкарты</h1>
      </header>

      {!currentSubject ? (
        <SubjectSelection selectSubject={selectSubject} subjects={subjects} />
      ) : (
        <>
          <Navigation currentMode={currentMode} changeMode={changeMode} />

          <div className="subject-header">
            <h2>{subjects[currentSubject].name}</h2>
            <button className="back-button" onClick={() => setCurrentSubject(null)}>
              ← Назад
            </button>
          </div>

          {currentMode === 'flashcards' && currentFlashcard && (
            <FlashcardMode
              flashcard={currentFlashcard}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              onNext={nextCard}
              currentIndex={currentCardIndex}
              totalCards={subjects[currentSubject].flashcards.length}
            />
          )}

          {currentMode === 'test' && currentFlashcard && (
            <TestMode
              question={currentFlashcard.question}
              options={currentFlashcard.options}
              correctAnswer={currentFlashcard.answer}
              selectedOption={selectedOption}
              showResult={showResult}
              onSelect={checkAnswer}
              onNext={nextCard}
              isLastCard={currentCardIndex === subjects[currentSubject].flashcards.length - 1}
              score={score}
              totalQuestions={subjects[currentSubject].flashcards.length}
            />
          )}
        </>
      )}
    </div>
  );
}

// ======== Компоненты ниже ========

function SubjectSelection({
  selectSubject,
  subjects
}: {
  selectSubject: (key: string) => void;
  subjects: SubjectsMap;
}) {
  return (
    <div className="subject-selection">
      <h2>Выберите предмет:</h2>
      <div className="subject-buttons">
        {Object.entries(subjects).map(([key, subject]) => (
          <button key={key} onClick={() => selectSubject(key)}>
            {subject.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Navigation({
  currentMode,
  changeMode
}: {
  currentMode: Mode;
  changeMode: (mode: Mode) => void;
}) {
  return (
    <nav className="navigation">
      {(['flashcards', 'learn', 'test', 'match'] as Mode[]).map((mode) => (
        <button
          key={mode}
          className={`nav-button ${currentMode === mode ? 'active' : ''}`}
          onClick={() => changeMode(mode)}
        >
          {mode[0].toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </nav>
  );
}

function FlashcardMode({
  flashcard,
  isFlipped,
  onFlip,
  onNext,
  currentIndex,
  totalCards
}: {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  onNext: () => void;
  currentIndex: number;
  totalCards: number;
}) {
  return (
    <div className="flashcard-container">
      <div className={`card ${isFlipped ? 'flipped' : ''}`} onClick={onFlip}>
        <div className="card-content">
          {isFlipped ? flashcard.answer : flashcard.question}
        </div>
      </div>

      <div className="controls">
        <div className="navigation-buttons">
          <span className="card-count">
            {currentIndex + 1}/{totalCards}
          </span>
          <button className="next-button" onClick={onNext}>
            Следующая →
          </button>
        </div>
      </div>
    </div>
  );
}

function TestMode({
  question,
  options,
  correctAnswer,
  selectedOption,
  showResult,
  onSelect,
  onNext,
  isLastCard,
  score,
  totalQuestions
}: {
  question: string;
  options: string[];
  correctAnswer: string;
  selectedOption: string | null;
  showResult: boolean;
  onSelect: (option: string) => void;
  onNext: () => void;
  isLastCard: boolean;
  score: number;
  totalQuestions: number;
}) {
  return (
    <div className="test-container">
      <div className="test-question">
        <p>{question}</p>
        <div className="options">
          {options.map((option, index) => (
            <button
              key={index}
              className={`option-button 
                ${selectedOption === option ? 'selected' : ''}
                ${showResult && option === correctAnswer ? 'correct' : ''}
                ${showResult && selectedOption === option && option !== correctAnswer ? 'incorrect' : ''}
              `}
              onClick={() => !showResult && onSelect(option)}
              disabled={showResult}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {showResult && (
        <div className="test-feedback">
          {selectedOption === correctAnswer ? (
            <p className="correct-feedback">✓ Верно!</p>
          ) : (
            <p className="incorrect-feedback">
              ✗ Неверно. Правильный ответ: {correctAnswer}
            </p>
          )}
          <button className="next-test-button" onClick={onNext}>
            {isLastCard ? 'Результаты' : 'Следующий →'}
          </button>
        </div>
      )}

      <div className="test-progress">
        Результат: {score}/{totalQuestions}
      </div>
    </div>
  );
}

export default App;