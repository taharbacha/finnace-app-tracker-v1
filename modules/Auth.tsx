
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store.tsx';
import { Lock, Shield } from 'lucide-react';

const Auth: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login, isAuthenticated } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) navigate('/', { replace: true });
    else { setError(true); setPassword(''); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6 relative">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 space-y-10 relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/40">M</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">MerchOS Gateway</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Operational Backend</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 text-slate-400`} size={20} />
            <input type="password" value={password} onChange={e => {setPassword(e.target.value); setError(false);}} className={`w-full pl-14 pr-4 py-5 bg-slate-50 border-2 ${error ? 'border-red-100' : 'border-slate-50'} rounded-[1.5rem] outline-none transition-all font-black text-slate-800 placeholder:text-slate-300`} placeholder="Passkey..." required />
          </div>
          {error && <p className="text-center text-red-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Access Denied</p>}
          <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30">Execute Entry</button>
        </form>
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <Shield size={14}/>
          <span className="text-[10px] font-black uppercase tracking-widest tracking-[0.2em]">Encrypted Data Tunnel</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
