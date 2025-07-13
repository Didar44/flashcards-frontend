import { useEffect, useState } from 'react';
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
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [unknownCards, setUnknownCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);

  useEffect(() => {
   
    const mockData: SubjectsMap = {
      math: {
        name: "Математика",
        flashcards: [
          {
            question: "2 + 2",
            answer: "4",
            options: ["3", "4", "5"],
            hint: "Простая арифметика"
          },
          {
            question: "5 × 3",
            answer: "15",
            options: ["10", "15", "20"],
            hint: "Умножение"
          }
        ]
      },
      science: {
        name: "Наука",
        flashcards: [
          {
            question: "Формула воды",
            answer: "H₂O",
            options: ["CO₂", "H₂O", "O₂"],
            hint: "Химия"
          }
        ]
      }
    };
    setSubjects(mockData);

    // Восстановление состояния
    const savedSubject = localStorage.getItem('currentSubject');
    const savedMode = localStorage.getItem('currentMode') as Mode | null;
    const savedIndex = localStorage.getItem('currentCardIndex');

    if (savedSubject && mockData[savedSubject]) {
      setCurrentSubject(savedSubject);
    }
    if (savedMode) {
      setCurrentMode(savedMode);
    }
    if (savedIndex !== null) {
      setCurrentCardIndex(Number(savedIndex));
    }
  }, []);

  const selectSubject = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentMode('flashcards');
    resetFullState();
  };

  const resetPerCardState = () => {
    setIsFlipped(false);
    setSelectedOption(null);
    setShowResult(false);
  };

  const resetFullState = () => {
    setIsFlipped(false);
    setSelectedOption(null);
    setShowResult(false);
    setCurrentCardIndex(0);
    setScore(0);
    setKnownCards([]);
    setUnknownCards([]);
    setMatchedPairs(0);
  };

  const changeMode = (mode: Mode) => {
    setCurrentMode(mode);
    resetFullState();
  };

  const currentFlashcard = currentSubject && subjects[currentSubject]
    ? subjects[currentSubject].flashcards[currentCardIndex]
    : null;

  const checkAnswer = (option: string) => {
    setSelectedOption(option);
    setShowResult(true);
    if (option === currentFlashcard?.answer) {
      setScore(prev => prev + 1);
      setKnownCards([...knownCards, currentCardIndex]);
    } else {
      setUnknownCards([...unknownCards, currentCardIndex]);
    }
  };

  const nextCard = () => {
    if (currentSubject && currentCardIndex < subjects[currentSubject].flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      resetPerCardState();
    } else if (currentMode === 'test') {
      alert(`Тест завершен! Ваш результат: ${score}/${subjects[currentSubject!].flashcards.length}`);

    }
  };

  const handleKnow = () => {
    if (!knownCards.includes(currentCardIndex)) {
      setKnownCards([...knownCards, currentCardIndex]);
    }
    nextCard();
  };

  const handleDontKnow = () => {
    if (!unknownCards.includes(currentCardIndex)) {
      setUnknownCards([...unknownCards, currentCardIndex]);
    }
    nextCard();
  };

  const handleMatch = (isCorrect: boolean) => {
    if (isCorrect) {
      setMatchedPairs(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (currentSubject) {
      localStorage.setItem('currentSubject', currentSubject);
      localStorage.setItem('currentMode', currentMode);
      localStorage.setItem('currentCardIndex', currentCardIndex.toString());
    }
  }, [currentSubject, currentMode, currentCardIndex]);

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
              onKnow={handleKnow}
              onDontKnow={handleDontKnow}
              currentIndex={currentCardIndex}
              totalCards={subjects[currentSubject].flashcards.length}
              knownCount={knownCards.length}
              unknownCount={unknownCards.length}
            />
          )}

          {currentMode === 'learn' && currentFlashcard && (
            <LearnMode
              flashcard={currentFlashcard}
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

          {currentMode === 'match' && currentSubject && (
            <MatchMode
              flashcards={subjects[currentSubject].flashcards}
              onBack={() => setCurrentMode('flashcards')}
              onMatch={handleMatch}
              matchedPairs={matchedPairs}
            />
          )}
        </>
      )}
    </div>
  );
}


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
          <button 
            key={key} 
            onClick={() => selectSubject(key)}
            className="subject-button"
          >
            {subject.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// Навигация по режимам
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
          {mode === 'flashcards' && 'Карточки'}
          {mode === 'learn' && 'Обучение'}
          {mode === 'test' && 'Тест'}
          {mode === 'match' && 'Сопоставление'}
        </button>
      ))}
    </nav>
  );
}

// Режим карточек
function FlashcardMode({
  flashcard,
  isFlipped,
  onFlip,
  onKnow,
  onDontKnow,
  currentIndex,
  totalCards,
  knownCount,
  unknownCount
}: {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  onKnow: () => void;
  onDontKnow: () => void;
  currentIndex: number;
  totalCards: number;
  knownCount: number;
  unknownCount: number;
}) {
  return (
    <div className="flashcard-container">
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-known" 
            style={{ width: `${(knownCount / totalCards) * 100}%` }}
            title="Знаю"
          ></div>
          <div 
            className="progress-unknown" 
            style={{ width: `${(unknownCount / totalCards) * 100}%` }}
            title="Не знаю"
          ></div>
        </div>
        <div className="progress-text">
          {currentIndex + 1} / {totalCards}
        </div>
      </div>

      <div 
        className={`card ${isFlipped ? 'flipped' : ''}`} 
        onClick={onFlip}
      >
        <div className="card-front">
          {flashcard.question}
          <div className="hint">{!isFlipped && flashcard.hint && `Подсказка: ${flashcard.hint}`}</div>
        </div>
        <div className="card-back">
          {flashcard.answer}
        </div>
      </div>

      {isFlipped && (
        <div className="action-buttons">
          <button 
            className="know-button" 
            onClick={onKnow}
          >
            Знаю 👍
          </button>
          <button 
            className="dont-know-button" 
            onClick={onDontKnow}
          >
            Не знаю 👎
          </button>
        </div>
      )}
    </div>
  );
}


function LearnMode({
  flashcard,
  onNext,
  currentIndex,
  totalCards
}: {
  flashcard: Flashcard;
  onNext: () => void;
  currentIndex: number;
  totalCards: number;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="learn-mode">
      <div className="learn-card">
        <h3>Вопрос:</h3>
        <p>{flashcard.question}</p>
        
        {showAnswer ? (
          <>
            <h3>Ответ:</h3>
            <p className="answer">{flashcard.answer}</p>
            <button 
              className="next-button" 
              onClick={() => {
                setShowAnswer(false);
                onNext();
              }}
            >
              Следующий вопрос
            </button>
          </>
        ) : (
          <button 
            className="show-answer-button"
            onClick={() => setShowAnswer(true)}
          >
            Показать ответ
          </button>
        )}
      </div>
      
      <div className="card-counter">
        Вопрос {currentIndex + 1} из {totalCards}
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
    <div className="test-mode">
      <div className="test-question">
        <h3>Вопрос:</h3>
        <p>{question}</p>
      </div>
      
      <div className="test-options">
        {options.map((option, index) => (
          <button
            key={index}
            className={`option-button 
              ${selectedOption === option ? 'selected' : ''}
              ${showResult && option === correctAnswer ? 'correct' : ''}
              ${showResult && selectedOption === option && option !== correctAnswer ? 'incorrect' : ''}`}
            onClick={() => !showResult && onSelect(option)}
            disabled={showResult}
          >
            {option}
          </button>
        ))}
      </div>
      
      {showResult && (
        <div className="test-feedback">
          <p className={selectedOption === correctAnswer ? 'correct-text' : 'incorrect-text'}>
            {selectedOption === correctAnswer ? '✓ Верно!' : `✗ Неверно. Правильный ответ: ${correctAnswer}`}
          </p>
          <button 
            className="next-button" 
            onClick={onNext}
          >
            {isLastCard ? 'Завершить тест' : 'Следующий вопрос'}
          </button>
        </div>
      )}
      
      <div className="test-progress">
        Правильных ответов: {score} из {totalQuestions}
      </div>
    </div>
  );
}

function MatchMode({
  flashcards,
  onBack,
  onMatch,
  matchedPairs
}: {
  flashcards: Flashcard[];
  onBack: () => void;
  onMatch: (isCorrect: boolean) => void;
  matchedPairs: number;
}) {
  const [selectedItems, setSelectedItems] = useState<{type: 'question' | 'answer', text: string}[]>([]);
  const [matchedItems, setMatchedItems] = useState<string[]>([]);

  const questions = flashcards.map(f => f.question);
  const answers = flashcards.map(f => f.answer);
  const allItems = [...questions, ...answers].sort(() => Math.random() - 0.5);

  const handleSelect = (item: string) => {
    if (selectedItems.length >= 2 || matchedItems.includes(item)) return;
    
    const type: "question" | "answer" = questions.includes(item) ? "question" : "answer";
const newSelected = [...selectedItems, {type, text: item}];
setSelectedItems(newSelected);

if (newSelected.length === 2) {
  const [first, second] = newSelected;
  // остальная логика
}



    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      const question = first.type === 'question' ? first.text : second.text;
      const answer = first.type === 'answer' ? first.text : second.text;
      
      const isCorrect = flashcards.some(f => f.question === question && f.answer === answer);
      
      setTimeout(() => {
        if (isCorrect) {
          setMatchedItems([...matchedItems, question, answer]);
          onMatch(true);
        }
        setSelectedItems([]);
      }, 1000);
    }
  };

  return (
    <div className="match-mode">
      <h3>Сопоставьте вопросы с ответами</h3>
      <p>Найдено пар: {matchedPairs} из {flashcards.length}</p>
      
      <div className="match-grid">
        {allItems.map((item, index) => {
          const isSelected = selectedItems.some(i => i.text === item);
          const isMatched = matchedItems.includes(item);
          const isQuestion = questions.includes(item);
          
          return (
            <button
              key={index}
              className={`match-item 
                ${isSelected ? 'selected' : ''} 
                ${isMatched ? 'matched' : ''}
                ${isQuestion ? 'question' : 'answer'}`}
              onClick={() => handleSelect(item)}
              disabled={isMatched}
            >
              {item}
            </button>
          );
        })}
      </div>
      
      <button 
        className="back-button"
        onClick={onBack}
      >
        ← Назад к карточкам
      </button>
    </div>
  );
}

export default App;
