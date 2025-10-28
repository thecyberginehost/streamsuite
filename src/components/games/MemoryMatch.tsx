import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Mail, Slack, Calendar, FileText, Webhook, Code, Zap } from 'lucide-react';

const ICONS = [Database, Mail, Slack, Calendar, FileText, Webhook, Code, Zap];

interface MemoryMatchProps {
  onSwitchGame?: () => void;
}

interface CardType {
  id: number;
  icon: typeof Database;
  flipped: boolean;
  matched: boolean;
}

export function MemoryMatch({ onSwitchGame }: MemoryMatchProps = {}) {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('memoryMatchBestScore');
    return saved ? parseInt(saved) : 999;
  });

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Create pairs of icons
    const iconPairs = [...ICONS, ...ICONS].map((icon, index) => ({
      id: index,
      icon,
      flipped: false,
      matched: false
    }));

    // Shuffle
    for (let i = iconPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [iconPairs[i], iconPairs[j]] = [iconPairs[j], iconPairs[i]];
    }

    setCards(iconPairs);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
  };

  const handleCardClick = (index: number) => {
    // Can't click if already flipped or matched
    if (cards[index].flipped || cards[index].matched || flippedIndices.length >= 2) {
      return;
    }

    // Flip the card
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // Check for match when 2 cards are flipped
    if (newFlipped.length === 2) {
      setMoves(moves + 1);

      const [firstIndex, secondIndex] = newFlipped;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      if (firstCard.icon === secondCard.icon) {
        // Match!
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIndex].matched = true;
          matchedCards[secondIndex].matched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatches(matches + 1);

          // Check if game is won
          if (matches + 1 === ICONS.length) {
            if (moves + 1 < bestScore) {
              setBestScore(moves + 1);
              localStorage.setItem('memoryMatchBestScore', (moves + 1).toString());
            }
          }
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].flipped = false;
          resetCards[secondIndex].flipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const isGameWon = matches === ICONS.length;

  return (
    <Card className="p-6 bg-slate-900 border-amber-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Memory Match</h3>
          <p className="text-sm text-slate-400">Match the workflow node pairs!</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-sm text-slate-400">Moves</div>
            <div className="text-2xl font-bold text-amber-400">{moves}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Best</div>
            <div className="text-2xl font-bold text-amber-400">{bestScore === 999 ? '-' : bestScore}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              disabled={card.flipped || card.matched}
              className={`
                aspect-square rounded-lg border-2 transition-all duration-300
                ${card.matched
                  ? 'bg-green-500/20 border-green-500/50 cursor-default'
                  : card.flipped
                    ? 'bg-amber-500/20 border-amber-500 cursor-default'
                    : 'bg-slate-800 border-slate-700 hover:border-amber-500/50 hover:bg-slate-700 cursor-pointer'
                }
              `}
            >
              {(card.flipped || card.matched) ? (
                <Icon className="w-full h-full p-4 text-white" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-slate-600 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isGameWon && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
          <h4 className="text-lg font-semibold text-green-400 mb-2">You Won!</h4>
          <p className="text-sm text-slate-300">
            Completed in {moves} moves
            {moves === bestScore && ' - New best score!'}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={initializeGame}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
        >
          {isGameWon ? 'Play Again' : 'Restart Game'}
        </Button>
        {onSwitchGame && (
          <Button
            onClick={onSwitchGame}
            variant="outline"
            className="flex-1 border-amber-500 text-amber-400 hover:bg-amber-500/10"
          >
            Play Another Game
          </Button>
        )}
      </div>
    </Card>
  );
}
