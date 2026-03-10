import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function TicketPass() {
  const [ticketData, setTicketData] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const name = urlParams.get('name');

    if (id && name) {
      setTicketData({ id, name });
    } else {
      setError(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative z-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-wide text-white">
          Startup<span className="text-mint">Syria</span>
        </h1>
      </header>

      <div className="bg-white/5 backdrop-blur-xl border border-mint/30 rounded-3xl p-10 w-full max-w-md text-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center gap-5">
        {error ? (
          <div className="text-red-500 text-lg font-semibold mt-5">
            Invalid Ticket Data
          </div>
        ) : ticketData ? (
          <div className="flex flex-col items-center gap-5 w-full">
            <div className="text-gray-light text-sm font-normal uppercase tracking-wider">
              Welcome to the StartupSyria Event!
            </div>
            <div className="text-3xl font-bold text-white leading-tight break-words">
              {ticketData.name}
            </div>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-mint/50 to-transparent my-2"></div>
            
            <div className="flex items-center gap-2 text-mint font-semibold text-lg">
              <CheckCircle size={24} />
              Valid Pass
            </div>
            
            <div className="mt-2">
              <div className="bg-mint/10 text-mint border border-mint px-5 py-2 rounded-full text-lg font-semibold tracking-widest inline-block">
                {ticketData.id}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-light">Loading...</div>
        )}
      </div>
    </div>
  );
}
