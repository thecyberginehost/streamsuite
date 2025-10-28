import { FlappyWorkflow } from './FlappyWorkflow';
import { MemoryMatch } from './MemoryMatch';
import { NodeConnect } from './NodeConnect';

export interface Game {
  id: string;
  name: string;
  component: React.ComponentType;
  description: string;
}

export const AVAILABLE_GAMES: Game[] = [
  {
    id: 'flappy-workflow',
    name: 'Flappy Workflow',
    component: FlappyWorkflow,
    description: 'Navigate through workflow obstacles!'
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    component: MemoryMatch,
    description: 'Match workflow node pairs'
  },
  {
    id: 'node-connect',
    name: 'Node Connect',
    component: NodeConnect,
    description: 'Connect nodes of the same color'
  }
];

/**
 * Randomly select a game for the user to play during generation
 */
export function selectRandomGame(): Game {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_GAMES.length);
  return AVAILABLE_GAMES[randomIndex];
}

export { FlappyWorkflow, MemoryMatch, NodeConnect };
