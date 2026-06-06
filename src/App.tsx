/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import UploadForm from './components/UploadForm';
import { Diagnosis } from './types';
import { Cloud, Activity, Trash2 } from 'lucide-react';

export default function App() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  const fetchDiagnoses = async () => {
    try {
      const res = await fetch('/api/diagnoses');
      if (res.ok) {
        const data = await res.json();
        setDiagnoses(data);
      }
    } catch (err) {
      console.error("Failed to fetch diagnoses", err);
    }
  };

  useEffect(() => {
    fetchDiagnoses();
    // Poll every 5 seconds to simulate real-time global updates for demo purposes
    const interval = setInterval(fetchDiagnoses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalysisComplete = (newDiagnosis: Diagnosis) => {
    // Optionally optimistically update or just re-fetch
    setDiagnoses(prev => [...prev, newDiagnosis]);
  };

  const handleClearDemoData = async () => {
    setIsClearing(true);
    try {
        await fetch('/api/diagnoses/clear', { method: 'POST' });
        await fetchDiagnoses();
    } catch (err) {
        console.error("Failed to clear data", err);
    } finally {
        setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen text-[#E4E4E7] font-sans flex flex-col pt-4">
      <div className="max-w-7xl mx-auto w-full px-4 flex flex-col flex-1 pb-4">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center">
              <Cloud className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">
                KazaSense <span className="text-emerald-500">Cloud</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium tracking-[0.2em] uppercase">
                Real-Time AI Diagnostics API • Global Outbreak Monitor
              </p>
            </div>
          </div>
          <div className="flex space-x-6 items-center">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">System Status</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Activity className="w-3 h-3" /> API ONLINE
              </span>
            </div>
            <button 
              onClick={handleClearDemoData}
              disabled={isClearing}
              className="text-zinc-500 hover:text-red-400 transition-colors p-2 border-l border-white/10 pl-6 flex flex-col items-center"
              title="Clear Database"
            >
              <Trash2 className="w-5 h-5 mb-1" />
              <span className="text-[9px] uppercase font-bold tracking-wider">Reset</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full flex flex-col lg:flex-row gap-4 min-h-0">
          
          {/* Left Column: Upload & Actions */}
          <div className="w-full lg:w-[360px] shrink-0 flex flex-col">
            <div className="flex-1 min-h-[400px]">
              <UploadForm onAnalysisComplete={handleAnalysisComplete} />
            </div>
          </div>

          {/* Right Column: Global Dashboard */}
          <div className="flex-1 h-[600px] lg:h-auto min-h-[500px] flex flex-col rounded-xl overflow-hidden glass relative">
            <Dashboard diagnoses={diagnoses} />
          </div>

        </main>
      </div>
    </div>
  );
}
