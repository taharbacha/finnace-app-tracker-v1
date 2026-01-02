
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Lock, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login, isAuthenticated } = useAppStore();
  const navigate = useNavigate();

  // If already authenticated, skip the login page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 space-y-8 animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-6 shadow-lg shadow-blue-200">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Merch By DZ</h1>
          <p className="text-slate-500 text-sm">Système d'exploitation privé. Veuillez vous identifier.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'} rounded-2xl outline-none focus:ring-4 focus:border-blue-400 transition-all text-slate-800 font-medium`}
                placeholder="••••••••••••"
                required
              />
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-slate-400'}`} size={20} />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-2 ml-1">
                <AlertCircle size={14} /> Accès refusé. Mot de passe incorrect.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            Accéder au Back-Office
          </button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-slate-300 font-medium uppercase tracking-tighter">
            © 2025 Merch By DZ • Opérations Sécurisées
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
