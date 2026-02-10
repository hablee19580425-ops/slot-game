
import { SymbolDef } from './types';

export const SYMBOLS: SymbolDef[] = [
  { id: 'whale', emoji: '🐳', weight: 1, payout: 250, name: 'Ancient Whale' },
  { id: 'shark', emoji: '🦈', weight: 3, payout: 100, name: 'Deep Hunter' },
  { id: 'octopus', emoji: '🐙', weight: 5, payout: 50, name: 'Abyssal Kraken' },
  { id: 'seven', emoji: '7️⃣', weight: 2, payout: 150, name: 'Lucky Abyss' },
  { id: 'cherry', emoji: '🍒', weight: 8, payout: 20, name: 'Sea Berry' },
  { id: 'fish', emoji: '🐠', weight: 10, payout: 10, name: 'Tropic Neon' },
];

export const WINNING_LINES = [
  [0, 1, 2, 3, 4], // Row 1
  [5, 6, 7, 8, 9], // Row 2
  [10, 11, 12, 13, 14], // Row 3
  [0, 6, 12, 8, 4], // V shape
  [10, 6, 2, 8, 14], // Inverted V
  [0, 1, 7, 3, 4], // Dip
  [10, 11, 7, 13, 14], // Hill
];

export const SPIN_COST = 100;
export const TARGET_RTP = 1.0;
export const INITIAL_ADMIN_ID = 'admin';
export const INITIAL_ADMIN_PW = '1234';
