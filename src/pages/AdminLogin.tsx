import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative z-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-wide text-white">
          Startup<span className="text-mint">Syria</span>
        </h1>
        <p className="text-gray-light mt-2">Admin Access Control</p>
      </header>

      <div className="bg-white/5 backdrop-blur-xl border border-mint/30 rounded-3xl p-8 w-full max-w-md shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-center mb-6">
          <div className="bg-mint/20 p-4 rounded-full">
            <Lock className="text-mint" size={32} />
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-gray-light text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mint transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-light text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mint transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mint hover:bg-mint-hover text-navy font-bold py-3 rounded-lg mt-4 transition-colors flex justify-center items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-navy"></div>
            ) : (
              'Login to Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
