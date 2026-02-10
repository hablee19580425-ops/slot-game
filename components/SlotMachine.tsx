
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SYMBOLS, WINNING_LINES, SPIN_COST, TARGET_RTP } from '../constants';
import { SymbolDef, GameState, User } from '../types';
import { updateUser } from '../services/userService';

interface SlotMachineProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onWin: (amount: number) => void;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ user, onUpdateUser, onWin }) => {
  const [grid, setGrid] = useState<SymbolDef[]>(new Array(15).fill(SYMBOLS[SYMBOLS.length - 1]));
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [winningIndices, setWinningIndices] = useState<Set<number>>(new Set());
  const [lastWinAmount, setLastWinAmount] = useState(0);

  // Speed level: 1 (Normal), 2 (Fast), 3 (Turbo)
  const [speedLevel, setSpeedLevel] = useState(1);

  // Auto-spin states
  const [plannedSpins, setPlannedSpins] = useState(1);
  const [remainingSpins, setRemainingSpins] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);

  // Ref to handle the "next spin" trigger to avoid closure staleness
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const getWeightedSymbol = useCallback(() => {
    const currentUser = userRef.current;
    const currentRTP = currentUser.totalBet > 0 ? currentUser.totalWin / currentUser.totalBet : 1;
    const adjustment = currentRTP > TARGET_RTP ? 0.6 : 1.4;

    const pool: SymbolDef[] = [];
    SYMBOLS.forEach(s => {
      const weight = s.id === 'whale' ? s.weight * (adjustment * 0.5) : s.weight * adjustment;
      for (let i = 0; i < weight * 10; i++) pool.push(s);
    });

    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const finalizeResult = useCallback(async () => {
    const finalGrid = new Array(15).fill(0).map(() => getWeightedSymbol());
    setGrid(finalGrid);

    let totalPayout = 0;
    const winIdxSet = new Set<number>();

    WINNING_LINES.forEach(line => {
      const firstSym = finalGrid[line[0]].id;
      if (line.every(idx => finalGrid[idx].id === firstSym)) {
        totalPayout += finalGrid[line[0]].payout;
        line.forEach(idx => winIdxSet.add(idx));
      }
    });

    setWinningIndices(winIdxSet);

    if (totalPayout > 0) {
      setGameState(GameState.WIN);
      setLastWinAmount(totalPayout); // Keep this value until next win
      const currentUser = userRef.current;
      const updatedUser = await updateUser(currentUser.id, {
        credit: currentUser.credit + totalPayout,
        totalWin: currentUser.totalWin + totalPayout
      });
      if (updatedUser) {
        onUpdateUser(updatedUser);
        onWin(totalPayout);
      }
    } else {
      setGameState(GameState.LOSE);
      if (!isAutoSpinning) {
        setTimeout(() => setGameState(GameState.IDLE), 1000);
      }
    }
  }, [getWeightedSymbol, onUpdateUser, onWin, isAutoSpinning]);

  const performSpin = useCallback(async () => {
    const currentUser = userRef.current;
    if (currentUser.credit < SPIN_COST) {
      setIsAutoSpinning(false);
      setRemainingSpins(0);
      setGameState(GameState.IDLE);
      return;
    }

    setGameState(GameState.SPINNING);
    setWinningIndices(new Set());

    // Deduct cost
    const updatedUser = await updateUser(currentUser.id, {
      credit: currentUser.credit - SPIN_COST,
      totalBet: currentUser.totalBet + SPIN_COST
    });
    if (updatedUser) onUpdateUser(updatedUser);

    let spins = 0;
    const maxSpins = speedLevel === 3 ? 5 : 10;
    const intervalTime = speedLevel === 1 ? 80 : speedLevel === 2 ? 40 : 10;

    const interval = setInterval(() => {
      setGrid(new Array(15).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
      spins++;
      if (spins > maxSpins) {
        clearInterval(interval);
        finalizeResult();
      }
    }, intervalTime);
  }, [finalizeResult, onUpdateUser, speedLevel]);

  // Handle auto-spin logic
  useEffect(() => {
    if (isAutoSpinning && gameState !== GameState.SPINNING) {
      if (remainingSpins > 0) {
        const waitLoss = speedLevel === 1 ? 800 : speedLevel === 2 ? 300 : 50;
        const waitWin = speedLevel === 1 ? 2000 : speedLevel === 2 ? 800 : 200;

        const timer = setTimeout(() => {
          setRemainingSpins(prev => prev - 1);
          performSpin();
        }, gameState === GameState.WIN ? waitWin : waitLoss);
        return () => clearTimeout(timer);
      } else {
        setIsAutoSpinning(false);
        setGameState(GameState.IDLE);
      }
    }
  }, [isAutoSpinning, remainingSpins, gameState, performSpin, speedLevel]);

  const handleStartSpin = () => {
    if (isAutoSpinning) {
      setIsAutoSpinning(false);
      setRemainingSpins(0);
      setGameState(GameState.IDLE);
      return;
    }

    if (plannedSpins > 1) {
      setIsAutoSpinning(true);
      setRemainingSpins(plannedSpins - 1);
      performSpin();
    } else {
      performSpin();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
      {/* Slot Grid Container */}
      <div className="relative p-4 bg-slate-900 neon-border rounded-xl w-full">
        <div className="grid grid-cols-5 gap-2 bg-slate-950 p-4 rounded-lg overflow-hidden h-[300px]">
          {grid.map((sym, i) => (
            <div
              key={i}
              className={`flex items-center justify-center text-4xl bg-slate-800 rounded-md border border-slate-700 transition-all duration-300
                ${winningIndices.has(i) ? 'bg-cyan-500/20 border-cyan-400 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : ''}
                ${gameState === GameState.SPINNING ? 'animate-pulse' : ''}
              `}
            >
              <span className={winningIndices.has(i) ? 'swimming' : ''}>{sym.emoji}</span>
            </div>
          ))}
        </div>

        {/* Decorative corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
      </div>

      {/* Integrated Action Bar */}
      <div className="w-full flex flex-col items-center gap-4">

        {/* Stats Row */}
        <div className="flex flex-wrap gap-4 justify-center w-full">
          <div className="bg-slate-900 px-6 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Credits</span>
            <span className="text-xl font-orbitron text-cyan-400 neon-glow">
              {user.credit.toLocaleString()}
            </span>
          </div>

          {/* Persistent Win Score Display */}
          <div className="bg-slate-900 px-8 py-2 rounded-xl border border-cyan-500/30 flex items-center gap-3 shadow-[0_0_15px_rgba(34,211,238,0.1)] min-w-[120px] justify-center">
            <span className="text-cyan-500/60 uppercase tracking-widest text-[10px] font-bold">Win</span>
            <span className="text-2xl font-orbitron text-yellow-400 neon-glow">
              {lastWinAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900 px-6 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Cost</span>
            <span className="text-xl font-orbitron text-pink-500">{SPIN_COST}</span>
          </div>
        </div>

        {/* Central Spin Console */}
        <div className="relative w-full max-w-2xl bg-slate-900 p-1 rounded-full border border-slate-800 flex items-center shadow-inner">

          {/* Slider Section (Integrated) */}
          <div className="flex-1 px-8 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-orbitron text-cyan-500/50 tracking-[0.2em] font-bold">AUTO-DIVE DEPTH</span>
              <span className="text-sm font-orbitron text-cyan-300">
                {isAutoSpinning ? (remainingSpins + 1) : plannedSpins}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              step="1"
              value={plannedSpins}
              disabled={isAutoSpinning || gameState === GameState.SPINNING}
              onChange={(e) => setPlannedSpins(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
              style={{
                background: `linear-gradient(to right, #22d3ee ${(plannedSpins / 1000) * 100}%, #1e293b 0%)`
              }}
            />
          </div>

          {/* Speed Controls (The 3 buttons) */}
          <div className="flex items-center gap-1 mr-4 bg-slate-950/50 p-1 rounded-full border border-slate-800">
            <button
              onClick={() => setSpeedLevel(1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${speedLevel === 1 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-600 hover:text-cyan-400'}`}
              title="Normal Speed"
            >
              <span className="text-[10px] font-bold">1x</span>
            </button>
            <button
              onClick={() => setSpeedLevel(2)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${speedLevel === 2 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-600 hover:text-cyan-400'}`}
              title="Fast Speed"
            >
              <span className="text-[10px] font-bold">{'>>'}</span>
            </button>
            <button
              onClick={() => setSpeedLevel(3)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${speedLevel === 3 ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-600 hover:text-pink-400'}`}
              title="Turbo Speed"
            >
              <span className="text-[10px] font-bold">TUR</span>
            </button>
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleStartSpin}
            disabled={(gameState === GameState.SPINNING && !isAutoSpinning) || (user.credit < SPIN_COST && !isAutoSpinning)}
            className={`
              h-16 px-12 rounded-full font-orbitron font-bold text-lg tracking-widest transition-all duration-300 min-w-[180px]
              ${isAutoSpinning
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] border-t border-red-400'
                : (gameState === GameState.SPINNING || user.credit < SPIN_COST)
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border-slate-700'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:shadow-[0_0_35px_rgba(34,211,238,0.5)] border-t border-cyan-300 active:scale-95'
              }
            `}
          >
            {isAutoSpinning ? 'ABORT' : (gameState === GameState.SPINNING ? '...' : 'LAUNCH')}
          </button>
        </div>
      </div>

      {/* Result Indicator */}
      <div className="h-12 flex items-center justify-center">
        {gameState === GameState.WIN && (
          <div className="text-3xl font-orbitron text-yellow-400 animate-bounce neon-glow uppercase tracking-tighter">
            System Overload: WIN!
          </div>
        )}
        {gameState === GameState.LOSE && !isAutoSpinning && (
          <div className="text-slate-600 font-orbitron text-xs tracking-[0.5em] uppercase">
            Void Detected
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotMachine;
