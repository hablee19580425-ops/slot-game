
export interface User {
  id: string;
  password?: string;
  role: 'user' | 'admin';
  credit: number;
  totalBet: number;
  totalWin: number;
}

export interface SymbolDef {
  id: string;
  emoji: string;
  weight: number;
  payout: number;
  name: string;
}

export enum GameState {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  WIN = 'WIN',
  LOSE = 'LOSE'
}

export interface SlotResult {
  grid: SymbolDef[];
  winningLines: number[][];
  totalPayout: number;
}
