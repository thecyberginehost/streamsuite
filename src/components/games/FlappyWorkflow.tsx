import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FlappyWorkflowProps {
  onClose?: () => void;
  onSwitchGame?: () => void;
}

export function FlappyWorkflow({ onClose, onSwitchGame }: FlappyWorkflowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappyWorkflowHighScore');
    return saved ? parseInt(saved) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const gameStateRef = useRef({
    bird: { y: 250, velocity: 0 },
    pipes: [] as Array<{ x: number; gap: number; gapY: number; passed: boolean }>,
    frame: 0,
    score: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants
    const GRAVITY = 0.5;
    const JUMP = -8;
    const BIRD_SIZE = 30;
    const PIPE_WIDTH = 60;
    const PIPE_GAP = 180;
    const PIPE_SPEED = 3;

    let animationId: number;
    let gameActive = true;

    const state = gameStateRef.current;

    // Initialize first pipe
    if (state.pipes.length === 0) {
      state.pipes.push({
        x: 600,
        gap: PIPE_GAP,
        gapY: 150 + Math.random() * 200,
        passed: false
      });
    }

    const handleJump = (e: MouseEvent | KeyboardEvent) => {
      if ('key' in e && e.key !== ' ') return;

      if (gameOver) {
        // Restart game
        state.bird = { y: 250, velocity: 0 };
        state.pipes = [{
          x: 600,
          gap: PIPE_GAP,
          gapY: 150 + Math.random() * 200,
          passed: false
        }];
        state.frame = 0;
        state.score = 0;
        setScore(0);
        setGameOver(false);
        gameActive = true;
      } else {
        state.bird.velocity = JUMP;
      }
    };

    canvas.addEventListener('click', handleJump);
    window.addEventListener('keydown', handleJump);

    const gameLoop = () => {
      if (!gameActive) return;

      // Clear canvas
      ctx.fillStyle = '#0f172a'; // Dark background
      ctx.fillRect(0, 0, 600, 500);

      // Update bird
      state.bird.velocity += GRAVITY;
      state.bird.y += state.bird.velocity;

      // Draw bird (node icon)
      ctx.fillStyle = '#8b5cf6'; // Purple
      ctx.beginPath();
      ctx.arc(100, state.bird.y, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw node connectors (wings)
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100 - 20, state.bird.y);
      ctx.lineTo(100 - 35, state.bird.y - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(100 - 20, state.bird.y);
      ctx.lineTo(100 - 35, state.bird.y + 10);
      ctx.stroke();

      // Update and draw pipes
      for (let i = state.pipes.length - 1; i >= 0; i--) {
        const pipe = state.pipes[i];
        pipe.x -= PIPE_SPEED;

        // Draw pipes (workflow nodes as obstacles)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;

        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);

        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.gapY + pipe.gap, PIPE_WIDTH, 500 - (pipe.gapY + pipe.gap));
        ctx.strokeRect(pipe.x, pipe.gapY + pipe.gap, PIPE_WIDTH, 500 - (pipe.gapY + pipe.gap));

        // Check if passed pipe
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 100) {
          pipe.passed = true;
          state.score++;
          setScore(state.score);
        }

        // Check collision
        const birdLeft = 100 - BIRD_SIZE / 2;
        const birdRight = 100 + BIRD_SIZE / 2;
        const birdTop = state.bird.y - BIRD_SIZE / 2;
        const birdBottom = state.bird.y + BIRD_SIZE / 2;

        if (
          birdRight > pipe.x &&
          birdLeft < pipe.x + PIPE_WIDTH &&
          (birdTop < pipe.gapY || birdBottom > pipe.gapY + pipe.gap)
        ) {
          gameActive = false;
          setGameOver(true);
          if (state.score > highScore) {
            setHighScore(state.score);
            localStorage.setItem('flappyWorkflowHighScore', state.score.toString());
          }
        }

        // Remove off-screen pipes
        if (pipe.x + PIPE_WIDTH < 0) {
          state.pipes.splice(i, 1);
        }
      }

      // Add new pipes
      if (state.pipes.length === 0 || state.pipes[state.pipes.length - 1].x < 300) {
        state.pipes.push({
          x: 600,
          gap: PIPE_GAP,
          gapY: 100 + Math.random() * 250,
          passed: false
        });
      }

      // Check boundaries
      if (state.bird.y < 0 || state.bird.y > 500) {
        gameActive = false;
        setGameOver(true);
        if (state.score > highScore) {
          setHighScore(state.score);
          localStorage.setItem('flappyWorkflowHighScore', state.score.toString());
        }
      }

      // Draw score
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, system-ui';
      ctx.fillText(state.score.toString(), 30, 50);

      state.frame++;
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('click', handleJump);
      window.removeEventListener('keydown', handleJump);
    };
  }, [gameOver, highScore]);

  return (
    <Card className="p-6 bg-slate-900 border-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Flappy Workflow</h3>
          <p className="text-sm text-slate-400">Click or press Space to jump!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">High Score</div>
          <div className="text-2xl font-bold text-purple-400">{highScore}</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={500}
          className="border border-slate-700 rounded-lg bg-slate-950"
        />

        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Game Over!</h3>
              <p className="text-xl text-purple-400 mb-4">Score: {score}</p>
              <div className="flex gap-3 justify-center mt-4">
                <Button
                  onClick={() => {
                    // Reset game state
                    gameStateRef.current.bird = { y: 250, velocity: 0 };
                    gameStateRef.current.pipes = [{
                      x: 600,
                      gap: 180,
                      gapY: 150 + Math.random() * 200,
                      passed: false
                    }];
                    gameStateRef.current.frame = 0;
                    gameStateRef.current.score = 0;
                    setScore(0);
                    setGameOver(false);
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Play Again
                </Button>
                {onSwitchGame && (
                  <Button
                    onClick={onSwitchGame}
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
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
