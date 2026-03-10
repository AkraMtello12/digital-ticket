import { useEffect, useState, useRef } from 'react';
import { collection, doc, getDoc, setDoc, onSnapshot, getDocs, deleteDoc, query } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Html5Qrcode } from 'html5-qrcode';
import { LogOut, QrCode, Download, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'valid' | 'invalid', message: string } | null>(null);
  const [stats, setStats] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'scanned_tickets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStats(snapshot.size);
    });
    
    return () => {
      unsubscribe();
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error("Error starting scanner", err);
      setScanning(false);
      alert("Failed to start camera. Please ensure you have granted camera permissions.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    setScanning(false);
  };

  const playSound = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.log("Audio play failed", e);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    await stopScanner();

    try {
      let url;
      try {
        url = new URL(decodedText);
      } catch (e) {
        throw new Error("Invalid QR Code format. Not a URL.");
      }

      const id = url.searchParams.get('id');
      if (!id) {
        throw new Error("No ticket ID found in QR Code.");
      }

      const ticketRef = doc(db, 'scanned_tickets', id);
      const ticketSnap = await getDoc(ticketRef);

      if (ticketSnap.exists()) {
        setScanResult({ status: 'invalid', message: `❌ INVALID: Ticket ${id} Already Scanned!` });
        playSound('error');
      } else {
        await setDoc(ticketRef, {
          id,
          timestamp: new Date().toISOString(),
          status: 'used'
        });
        setScanResult({ status: 'valid', message: `✅ Valid Ticket: ${id}` });
        playSound('success');
      }
    } catch (error: any) {
      setScanResult({ status: 'invalid', message: error.message || "Error processing ticket" });
      playSound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const onScanFailure = (error: any) => {
    // ignore background scan failures
  };

  const handleExport = async () => {
    const q = query(collection(db, 'scanned_tickets'));
    const snapshot = await getDocs(q);
    let csv = 'Ticket ID,Timestamp,Status\n';
    snapshot.forEach((doc) => {
      const data = doc.data();
      csv += `${data.id},${data.timestamp},${data.status}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanned_tickets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to delete ALL scanned tickets? This cannot be undone.")) return;
    
    const q = query(collection(db, 'scanned_tickets'));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'scanned_tickets', docSnap.id)));
    await Promise.all(deletePromises);
    alert("All scans reset successfully.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-5 relative z-10">
      <header className="w-full max-w-3xl flex justify-between items-center mb-8 mt-4">
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Admin<span className="text-mint">Dashboard</span>
        </h1>
        <button 
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 text-gray-light hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg">
          <div className="text-gray-light text-sm uppercase tracking-wider mb-2">Total Scans</div>
          <div className="text-4xl font-bold text-mint">{stats}</div>
        </div>
        
        <button 
          onClick={handleExport}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg transition-colors group"
        >
          <Download className="text-mint mb-2 group-hover:scale-110 transition-transform" size={32} />
          <div className="text-white font-semibold">Export Data</div>
        </button>
        
        <button 
          onClick={handleReset}
          className="bg-red-500/5 hover:bg-red-500/10 backdrop-blur-xl border border-red-500/50 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg transition-colors group"
        >
          <Trash2 className="text-red-500 mb-2 group-hover:scale-110 transition-transform" size={32} />
          <div className="text-red-500 font-semibold">Reset Scans</div>
        </button>
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-mint/30 rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center">
        
        {!scanning && !scanResult && (
          <div className="flex flex-col items-center text-center">
            <div className="bg-mint/20 p-6 rounded-full mb-6">
              <QrCode className="text-mint" size={48} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ready to Scan</h2>
            <p className="text-gray-light mb-8">Click the button below to open your camera and scan attendee tickets.</p>
            <button 
              onClick={startScanner}
              className="w-full bg-mint hover:bg-mint-hover text-navy font-bold py-4 rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
            >
              <QrCode size={24} />
              Scan Ticket
            </button>
          </div>
        )}

        <div className={`w-full ${scanning ? 'block' : 'hidden'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Scanning...</h2>
            <button onClick={stopScanner} className="text-gray-light hover:text-white text-sm">Cancel</button>
          </div>
          <div id="reader" className="w-full rounded-xl overflow-hidden border-2 border-mint/50 bg-black min-h-[300px]"></div>
        </div>

        {scanResult && !scanning && (
          <div className="flex flex-col items-center text-center w-full">
            {scanResult.status === 'valid' ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="text-mint mb-4" size={80} />
                <h2 className="text-2xl font-bold text-mint mb-2">Valid Ticket</h2>
                <p className="text-white text-lg bg-mint/10 px-4 py-2 rounded-lg border border-mint/30">{scanResult.message}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <XCircle className="text-red-500 mb-4" size={80} />
                <h2 className="text-2xl font-bold text-red-500 mb-2">Invalid Ticket</h2>
                <p className="text-white text-lg bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">{scanResult.message}</p>
              </div>
            )}
            
            <button 
              onClick={startScanner}
              className="w-full bg-navy/50 border border-mint text-mint hover:bg-mint hover:text-navy font-bold py-4 rounded-xl mt-8 transition-colors text-lg"
            >
              Scan Next Ticket
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
