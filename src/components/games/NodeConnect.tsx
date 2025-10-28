import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NodeConnectProps {
  onSwitchGame?: () => void;
}

interface Node {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  connected: boolean;
}

export function NodeConnect({ onSwitchGame }: NodeConnectProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45); // Increased from 30 to 45 seconds
  const [gameActive, setGameActive] = useState(true);
  const [bonusMessage, setBonusMessage] = useState<string>('');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('nodeConnectHighScore');
    return saved ? parseInt(saved) : 0;
  });

  const gameStateRef = useRef({
    nodes: [] as Node[],
    currentPath: [] as number[],
    score: 0,
    colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b']
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Initialize nodes with guaranteed matches
    const initNodes = () => {
      state.nodes = [];
      const grid: string[][] = [[], [], []]; // 3 rows, 4 columns each

      // Strategy: Create guaranteed matching patterns
      // Place colors in clusters to ensure adjacent matches
      const patterns = [
        // Pattern 1: Horizontal lines
        [0, 0, 0, 1, 2, 2, 2, 3, 4, 4, 4, 1],
        // Pattern 2: Vertical groups
        [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
        // Pattern 3: Mixed clusters
        [0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4],
        // Pattern 4: L-shapes
        [0, 0, 1, 2, 0, 3, 1, 2, 4, 3, 1, 4],
        // Pattern 5: Diagonal-ish
        [0, 1, 1, 2, 0, 0, 3, 2, 4, 3, 3, 4]
      ];

      // Select a random pattern
      const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];

      // Shuffle the pattern slightly while maintaining some adjacency
      const shuffledPattern = [...selectedPattern];
      for (let i = shuffledPattern.length - 1; i > 0; i--) {
        // Only shuffle with probability 30% to maintain some structure
        if (Math.random() < 0.3) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledPattern[i], shuffledPattern[j]] = [shuffledPattern[j], shuffledPattern[i]];
        }
      }

      for (let i = 0; i < 12; i++) {
        const colorIndex = shuffledPattern[i];
        state.nodes.push({
          id: i,
          x: 100 + (i % 4) * 125,
          y: 100 + Math.floor(i / 4) * 125,
          radius: 25,
          color: state.colors[colorIndex],
          connected: false
        });
      }
    };

    if (state.nodes.length === 0) {
      initNodes();
    }

    let animationId: number;

    const drawNode = (node: Node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.connected ? '#334155' : node.color;
      ctx.fill();
      ctx.strokeStyle = node.connected ? '#64748b' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const drawConnection = (from: Node, to: Node) => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = from.color;
      ctx.lineWidth = 4;
      ctx.stroke();
    };

    const checkConnection = (nodeIndex: number) => {
      if (state.currentPath.length === 0) {
        state.currentPath.push(nodeIndex);
        return;
      }

      const lastIndex = state.currentPath[state.currentPath.length - 1];
      const lastNode = state.nodes[lastIndex];
      const currentNode = state.nodes[nodeIndex];

      // Check if same color and adjacent
      if (
        lastNode.color === currentNode.color &&
        !currentNode.connected &&
        nodeIndex !== lastIndex
      ) {
        const dx = Math.abs(lastNode.x - currentNode.x);
        const dy = Math.abs(lastNode.y - currentNode.y);
        const isAdjacent = (dx === 125 && dy === 0) || (dx === 0 && dy === 125);

        if (isAdjacent) {
          state.currentPath.push(nodeIndex);

          // Check if path is complete (3 or more nodes)
          if (state.currentPath.length >= 3) {
            const chainLength = state.currentPath.length;
            state.currentPath.forEach(idx => {
              state.nodes[idx].connected = true;
            });

            // Score based on chain length
            const points = chainLength * 2; // 2 points per node
            state.score += points;
            setScore(state.score);

            // Add bonus time for good chains
            if (chainLength >= 4) {
              setTimeLeft(prev => Math.min(prev + 3, 60)); // +3 seconds for 4+ chain
              setBonusMessage('+3 seconds!');
              setTimeout(() => setBonusMessage(''), 1500);
            } else if (chainLength >= 3) {
              setTimeLeft(prev => Math.min(prev + 1, 60)); // +1 second for 3 chain
              setBonusMessage('+1 second!');
              setTimeout(() => setBonusMessage(''), 1500);
            }

            state.currentPath = [];

            // Check if all nodes are connected
            const allConnected = state.nodes.every(n => n.connected);
            if (allConnected) {
              // Big bonus and new board
              state.score += 20;
              setScore(state.score);
              setTimeLeft(prev => Math.min(prev + 10, 60)); // +10 seconds for clearing board
              setBonusMessage('Board Clear! +10 seconds!');
              setTimeout(() => setBonusMessage(''), 2000);
              initNodes();
            }
          }
        } else {
          // Not adjacent - reset path
          state.currentPath = [nodeIndex];
        }
      } else {
        // Different color or already connected - reset path
        state.currentPath = [nodeIndex];
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      if (!gameActive) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check which node was clicked
      for (let i = 0; i < state.nodes.length; i++) {
        const node = state.nodes[i];
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance <= node.radius && !node.connected) {
          checkConnection(i);
          break;
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 600, 450);

      // Draw current path
      for (let i = 0; i < state.currentPath.length - 1; i++) {
        drawConnection(
          state.nodes[state.currentPath[i]],
          state.nodes[state.currentPath[i + 1]]
        );
      }

      // Draw nodes
      state.nodes.forEach(node => drawNode(node));

      // Draw hint for current path
      if (state.currentPath.length > 0) {
        const lastNode = state.nodes[state.currentPath[state.currentPath.length - 1]];
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Inter, system-ui';
        ctx.fillText(`Chain: ${state.currentPath.length}`, 20, 30);
        ctx.fillStyle = lastNode.color;
        ctx.fillText('(need 3+ same color adjacent)', 90, 30);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gameActive]);

  // Timer
  useEffect(() => {
    if (!gameActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('nodeConnectHighScore', score.toString());
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, timeLeft, score, highScore]);

  const restartGame = () => {
    gameStateRef.current.nodes = [];
    gameStateRef.current.currentPath = [];
    gameStateRef.current.score = 0;
    setScore(0);
    setTimeLeft(45); // Increased from 30 to 45 seconds
    setGameActive(true);
  };

  return (
    <Card className="p-6 bg-slate-900 border-cyan-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Node Connect</h3>
          <p className="text-sm text-slate-400">Connect 3+ adjacent nodes of same color!</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-sm text-slate-400">Time</div>
            <div className="text-2xl font-bold text-cyan-400">{timeLeft}s</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Score</div>
            <div className="text-2xl font-bold text-cyan-400">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Best</div>
            <div className="text-2xl font-bold text-cyan-400">{highScore}</div>
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={450}
          className="border border-slate-700 rounded-lg bg-slate-950"
        />

        {/* Bonus message overlay */}
        {bonusMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg animate-bounce">
            {bonusMessage}
          </div>
        )}

        {!gameActive && timeLeft === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Time's Up!</h3>
              <p className="text-xl text-cyan-400 mb-4">Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="text-lg text-green-400 mb-4">New High Score!</p>
              )}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={restartGame}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Play Again
                </Button>
                {onSwitchGame && (
                  <Button
                    onClick={onSwitchGame}
                    variant="outline"
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Play Another Game
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
