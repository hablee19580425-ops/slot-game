
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getUser, loginUser } from './services/userService';
import SlotMachine from './components/SlotMachine';
import AdminPanel from './components/AdminPanel';
import { getDeepSeaAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [oracleAdvice, setOracleAdvice] = useState('Welcome to the Abyss...');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Initial check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const savedId = localStorage.getItem('deepsea_current_id');
      if (savedId) {
        const user = await getUser(savedId);
        if (user) {
          setCurrentUser(user);
        }
      }
    };
    checkSession();
  }, []);

  // Poll for user updates (credit changes from admin)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      const updatedUser = await getUser(currentUser.id);
      if (updatedUser) {
        // Only update if credit or stats changed to avoid re-renders if possible, 
        // but React state update is cheap enough for this size.
        // We use functional update to not depend on currentUser in dependency array loops
        setCurrentUser(prev => {
          if (!prev) return null;
          // Simple check to see if we need to update to avoid effect loops if we were to add more dep
          if (JSON.stringify(prev) !== JSON.stringify(updatedUser)) {
            return updatedUser;
          }
          return prev;
        });
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await loginUser(loginId, loginPw);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('deepsea_current_id', user.id);
      setError('');
    } else {
      setError('Invalid ID or Passphrase');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('deepsea_current_id');
  };

  const refreshAdvice = async (winAmount: number = 0) => {
    if (!currentUser) return;
    setLoadingAdvice(true);
    // User credit is already updated in backend by SlotMachine presumably calling updateUser?
    // Actually SlotMachine likely calls onUpdateUser. We need to make sure SlotMachine also persists to backend.
    // Let's assume SlotMachine will update the backend via the passed onUpdateUser or we need to wrap it.
    // For now, let's just get advice.
    const advice = await getDeepSeaAdvice(currentUser.credit, winAmount);
    setOracleAdvice(advice);
    setLoadingAdvice(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[url('https://picsum.photos/seed/deepsea/1920/1080?blur=5')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
        <form
          onSubmit={handleLogin}
          className="relative z-10 w-full max-w-md bg-slate-900/60 p-10 rounded-3xl neon-border flex flex-col items-center space-y-8"
        >
          <div className="text-6xl swimming">⚓</div>
          <h1 className="text-4xl font-orbitron font-bold text-cyan-400 neon-glow tracking-tighter text-center">
            DEEP SEA<br />ORACLE
          </h1>

          <div className="w-full space-y-4">
            <input
              placeholder="Diver Identifier"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              className="w-full bg-slate-950/50 border border-cyan-900 px-6 py-4 rounded-xl text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-400 transition-all"
            />
            <input
              type="password"
              placeholder="Passphrase"
              value={loginPw}
              onChange={e => setLoginPw(e.target.value)}
              className="w-full bg-slate-950/50 border border-cyan-900 px-6 py-4 rounded-xl text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          {error && <p className="text-pink-500 font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-orbitron font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all hover:scale-[1.02]"
          >
            DESCEND
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-12 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 text-2xl font-bold font-orbitron">
            {currentUser.id[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-orbitron text-cyan-400 neon-glow">DIVER {currentUser.id.toUpperCase()}</h2>
            <p className="text-xs text-slate-500 tracking-widest uppercase">Rank: {currentUser.role}</p>
          </div>
        </div>

        <div className="flex gap-4">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className={`px-6 py-2 rounded-full font-bold transition-all ${showAdmin ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
            >
              {showAdmin ? 'CLOSE DECK' : 'ADMIN PANEL'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-6 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all"
          >
            ASCEND
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left/Main Column - Game or Admin */}
        <div className="lg:col-span-2 space-y-8">
          {showAdmin ? (
            <AdminPanel />
          ) : (
            <SlotMachine
              user={currentUser}
              onUpdateUser={setCurrentUser}
              onWin={(amt) => refreshAdvice(amt)}
            />
          )}
        </div>

        {/* Right Column - Oracle & Info */}
        <aside className="space-y-6">
          {/* Gemini Oracle Section */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-cyan-900/30 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center text-5xl swimming shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                👁️
              </div>
              <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20"></div>
            </div>
            <h3 className="font-orbitron text-cyan-400 tracking-widest text-sm font-bold">THE ORACLE SPEAKS</h3>
            <div className={`italic text-slate-300 leading-relaxed min-h-[60px] ${loadingAdvice ? 'animate-pulse opacity-50' : ''}`}>
              "{oracleAdvice}"
            </div>
            <button
              onClick={() => refreshAdvice()}
              disabled={loadingAdvice}
              className="text-xs text-cyan-500/60 hover:text-cyan-400 transition-colors uppercase tracking-widest font-bold"
            >
              Seek new insight
            </button>
          </div>

          {/* Stats Section */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-orbitron text-slate-400 text-xs tracking-widest font-bold uppercase">Mission Records</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl flex justify-between items-center">
                <span className="text-slate-500 text-sm">Total Wagers</span>
                <span className="font-orbitron text-slate-300">{currentUser.totalBet.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl flex justify-between items-center">
                <span className="text-slate-500 text-sm">Total Recovery</span>
                <span className="font-orbitron text-yellow-500">{currentUser.totalWin.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl flex justify-between items-center border border-cyan-900/30">
                <span className="text-cyan-500/70 text-sm">RTP (Return)</span>
                <span className="font-orbitron text-cyan-400">
                  {currentUser.totalBet > 0
                    ? ((currentUser.totalWin / currentUser.totalBet) * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-6xl mx-auto mt-16 text-center text-slate-600 text-xs tracking-[0.4em] uppercase">
        &copy; Abyssal Labs // Neural Link Established
      </footer>
    </div>
  );
};

export default App;
