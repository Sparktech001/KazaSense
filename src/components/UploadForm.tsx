import { useState, useRef, ChangeEvent } from 'react';
import { Camera, ImageUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Diagnosis } from '../types';

interface UploadFormProps {
    onAnalysisComplete: (diagnosis: Diagnosis) => void;
}

export default function UploadForm({ onAnalysisComplete }: UploadFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [type, setType] = useState<'crop' | 'poultry'>('crop');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diagResult, setDiagResult] = useState<Diagnosis | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
            setError(null);
            setDiagResult(null);
        }
    };

    const clearSelection = () => {
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        setDiagResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError('Please select an image first.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            // Get mock geolocation for the sake of the demo
            // In a real app we would use navigator.geolocation
            // Let's generate a slight random offset from a central point to scatter pins
            const baseLat = 37.0902 + (Math.random() - 0.5) * 10;
            const baseLng = -95.7129 + (Math.random() - 0.5) * 20;

            const formData = new FormData();
            formData.append('image', file);
            formData.append('lat', baseLat.toString());
            formData.append('lng', baseLng.toString());
            formData.append('type', type);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze image');
            }

            onAnalysisComplete(data);
            setDiagResult(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="glass rounded-xl p-6 flex flex-col h-full border-none relative overflow-hidden">
            {isAnalyzing && <div className="scanline"></div>}
            
            {diagResult && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <Camera className="w-6 h-6" />
                    </div>
                    <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#E4E4E7] mb-1">Diagnosis Complete</h3>
                    <p className="text-xl font-bold text-emerald-400 mb-2">{diagResult.disease}</p>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-400 mb-4 inline-block">
                        Severity: <span className="font-bold uppercase" style={{ color: diagResult.severity.toLowerCase() === 'high' || diagResult.severity.toLowerCase() === 'critical' ? '#ef4444' : '#10b981' }}>{diagResult.severity}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-8 max-w-sm leading-relaxed">{diagResult.recommendation}</p>
                    <button 
                        onClick={clearSelection}
                        className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all active:scale-[0.98] flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Scan Another Image
                    </button>
                    <div className="absolute bottom-4 text-[9px] text-zinc-600 font-mono tracking-widest uppercase">
                        Model ID: YOLOv8-ResNet50_v4
                    </div>
                </div>
            )}
            
            <div className="mb-6 relative z-10">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#E4E4E7] flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Scan & Diagnose
                </h2>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono uppercase">
                    Upload a photo of a diseased leaf or poultry to our real-time cloud diagnostic engine.
                </p>
            </div>

            <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-lg border border-white/5 relative z-10">
                <button
                    onClick={() => setType('crop')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                        type === 'crop' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Crop / Plant
                </button>
                <button
                    onClick={() => setType('poultry')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                        type === 'poultry' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Poultry / Animal
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center mb-6 relative z-10">
                {!previewUrl ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full min-h-[240px] border border-dashed border-emerald-500/30 rounded-xl bg-black/20 hover:bg-emerald-500/5 transition-colors flex flex-col items-center justify-center cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-emerald-500 border border-emerald-500/20">
                            <Camera className="w-8 h-8" />
                        </div>
                        <p className="text-[#E4E4E7] font-semibold text-sm">Tap to snap a photo</p>
                        <p className="text-xs text-zinc-600 mt-1">or browse gallery</p>
                    </div>
                ) : (
                    <div className="w-full h-full min-h-[240px] rounded-xl overflow-hidden relative group border border-emerald-500/30 bg-black">
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className={`w-full h-full object-contain ${isAnalyzing ? 'opacity-50' : 'opacity-100'} transition-opacity`}
                        />
                        <button 
                            onClick={clearSelection}
                            className="absolute top-3 right-3 bg-red-500/20 border border-red-500/40 backdrop-blur-sm p-2 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                            title="Remove image"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        {isAnalyzing && (
                            <div className="absolute inset-4 border border-emerald-500/30 pointer-events-none">
                                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-500"></div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-500"></div>
                                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-500"></div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-500"></div>
                                <div className="absolute top-4 left-4 px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 text-[10px] font-bold text-emerald-400 uppercase font-mono animate-pulse">Running Inference...</div>
                            </div>
                        )}
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    capture="environment" // Suggests back camera on mobile
                    onChange={handleFileChange}
                />
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] uppercase font-bold tracking-wider flex gap-2 items-start relative z-10">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <button
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className={`w-full py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative z-10 border
                    ${!file || isAnalyzing 
                        ? 'bg-black/40 text-zinc-600 border-white/5 cursor-not-allowed' 
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500 hover:text-black active:scale-[0.98]'
                    }`}
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <ImageUp className="w-5 h-5" />
                        Run Diagnosis
                    </>
                )}
            </button>
        </div>
    );
}
