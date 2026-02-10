
import React, { useState } from 'react';
import { getUsers, getUser, loginUser, updateUser } from '../services/userService';
import { User } from '../types';

const AdminPanel: React.FC = () => {
  const [newUserId, setNewUserId] = useState('');
  const [newUserPw, setNewUserPw] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [chargeAmount, setChargeAmount] = useState(0);
  const [message, setMessage] = useState('');

  const handleAddUser = async () => {
    if (!newUserId || !newUserPw) return;
    try {
      // In the new API, loginUser creates a user if not exists (based on my server implementation logic for this simple app)
      // But AdminPanel implies explict creation.
      // Let's use loginUser to "create" or check.
      // Or better, let's just make a dedicated register endpoint or use login for now as per server logic.
      // Actually, my server login implementation: "User doesn't exist, auto-register".
      // So calling loginUser with the new creds will create it.
      // Ideally I should have made a register endpoint, but for now this works.
      // Wait, `loginUser` logs them in. The admin panel just wants to CREATE.
      // I should probably add a register function to userService that calls login (since login auto-creates).
      // Or just call loginUser and ignore the token/session.

      // Let's check if user exists first.
      const existing = await getUsers();
      if (existing[newUserId]) {
        setMessage('User likely exists (checked via list)');
        return;
      }

      // Hack: Login to create. 
      // In a real app we'd have `createUser`.
      // My server `login` auto-creates.
      const newUser = await loginUser(newUserId, newUserPw);

      if (newUser) {
        setMessage(`User ${newUserId} created.`);
        setNewUserId('');
        setNewUserPw('');
      } else {
        setMessage('Failed to create user');
      }
    } catch (e) {
      setMessage('Error creating user');
    }
  };

  const handleCharge = async () => {
    if (!targetUserId || chargeAmount <= 0) return;

    // We need to fetch the current user to add credit? 
    // Or just send the new credit amount? 
    // Server `PATCH` takes `{ credit: val }`. It sets it to that value.
    // So we need to read current first.

    const user = await getUser(targetUserId);
    if (!user) {
      setMessage('User not found');
      return;
    }

    const newCredit = user.credit + chargeAmount;
    const updated = await updateUser(targetUserId, { credit: newCredit });

    if (updated) {
      setMessage(`Charged ${chargeAmount} to ${targetUserId}. New Balance: ${updated.credit}`);
      setChargeAmount(0);
    } else {
      setMessage('Update failed');
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-red-500/30 w-full max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-orbitron text-red-500 neon-glow border-b border-red-500/20 pb-4">
        CONTROL DECK
      </h2>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-200">Enlist New Diver</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            placeholder="User ID"
            value={newUserId}
            onChange={e => setNewUserId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
          />
          <input
            type="password"
            placeholder="Passphrase"
            value={newUserPw}
            onChange={e => setNewUserPw(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
          />
          <button
            onClick={handleAddUser}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            CREATE
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-200">Fuel Supply (Credit Charge)</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            placeholder="Target ID"
            value={targetUserId}
            onChange={e => setTargetUserId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
          />
          <input
            type="number"
            placeholder="Amount"
            value={chargeAmount}
            onChange={e => setChargeAmount(Number(e.target.value))}
            className="w-32 bg-slate-950 border border-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
          />
          <button
            onClick={handleCharge}
            className="bg-slate-200 hover:bg-white text-slate-900 px-6 py-2 rounded-lg font-bold transition-colors"
          >
            CHARGE
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-red-900/30 text-red-300 p-3 rounded-lg text-center font-bold animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
