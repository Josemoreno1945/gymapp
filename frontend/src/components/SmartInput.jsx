import { useState, useEffect, useRef } from 'react';
import { parseWorkout } from '../utils/smartParser';
import api from '../api/client';
import { useErrorModal } from '../context/ErrorModalContext';

export default function SmartInput({ onLogCreated }) {
  const [ejercicio, setEjercicio] = useState('');
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [nota, setNota] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showError } = useErrorModal();
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (raw.trim()) {
      setParsed(parseWorkout(raw, 'kg'));
    } else {
      setParsed(null);
    }
  }, [raw]);

  const isValid = ejercicio.trim() && parsed && parsed.sets && parsed.reps && parsed.error === null;

  function handleKeyDown(e) {
    if (e.key === 'Enter' && isValid) handleSave();
  }

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    
    try {
      const res = await api.post('/training/logs', {
        ejercicio: ejercicio.trim(),
        formato_raw: raw.trim().replace(/\s/g, ''), // Normalize format to setsxreps@peso
        nota: nota.trim() || undefined
      });
      
      onLogCreated(res.data.log);
      
      setRaw('');
      setNota('');
      // Mantener ejercicio para la siguiente serie
      setParsed(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage ||
        err.response?.data?.detalles?.[0]?.mensaje ||
        err.response?.data?.error ||
        'No se pudo guardar el registro. Intenta nuevamente.',
        'Error al guardar'
      );
    } finally {
      setSaving(false);
    }
  }

  const statColors = {
    sets:   'text-[#00ff66]',
    reps:   'text-[#42ffe0]',
    weight: 'text-[#ff2d78]',
    volume: 'text-[#bf5af2]',
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Ejercicio Input */}
      <div>
        <input
          type="text"
          value={ejercicio}
          onChange={(e) => setEjercicio(e.target.value)}
          placeholder="Nombre del Ejercicio (ej: Press Banca)"
          className="w-full bg-[#050505] text-[#00ff66] font-mono text-sm uppercase tracking-wider
            border border-neutral-800 rounded-lg px-4 py-3 outline-none transition-colors
            placeholder:text-neutral-700 placeholder:normal-case placeholder:tracking-normal
            focus:border-[#00ff66]/50 focus:ring-1 focus:ring-[#00ff66]/20"
        />
      </div>

      {/* Main input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Formato: 3x12@80kg'
          autoComplete="off"
          spellCheck={false}
          className={`
            w-full bg-[#050505] text-white font-mono text-sm
            border rounded-lg px-4 py-3 pr-12 outline-none transition-all duration-200
            placeholder:text-neutral-700
            focus:ring-1
            ${isValid
              ? 'border-[#00ff66] focus:ring-[#00ff66]/40 shadow-[0_0_8px_#00ff6644]'
              : parsed?.error
                ? 'border-[#ff2d78] focus:ring-[#ff2d78]/40 shadow-[0_0_8px_#ff2d7844]'
                : 'border-neutral-800 focus:ring-[#42ffe0]/30 focus:border-[#42ffe0]'
            }
          `}
        />
        {/* Pulse indicator */}
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors duration-300
          ${isValid ? 'bg-[#00ff66] shadow-[0_0_6px_#00ff66] animate-pulse' : 'bg-neutral-700'}`}
        />
      </div>

      {/* XAI Breakdown Panel */}
      {parsed && (
        <div className="animate-fade-in glass-card rounded-lg px-4 py-3 border border-neutral-800">
          {parsed.error ? (
            <p className="text-[#ff2d78] font-mono text-xs flex items-center gap-2">
              <span className="text-lg">⚠</span>
              {parsed.error}
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Series',  value: parsed.sets,   key: 'sets',   suffix: '' },
                { label: 'Reps',    value: parsed.reps,   key: 'reps',   suffix: '' },
                { label: 'Peso',    value: parsed.weight, key: 'weight', suffix: parsed.unit },
                { label: 'Volumen', value: parsed.volume, key: 'volume', suffix: parsed.unit },
              ].map(({ label, value, key, suffix }) => (
                <div key={key} className="flex flex-col items-center min-w-[64px]">
                  <span className="text-neutral-600 text-[10px] uppercase tracking-widest font-sans">{label}</span>
                  <span className={`font-mono font-bold text-lg ${statColors[key]}`}>
                    {value ?? '—'}
                    {suffix && <span className="text-xs ml-0.5 opacity-70">{suffix}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note field + Save button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota opcional"
          maxLength={80}
          className="flex-1 bg-[#050505] text-neutral-300 text-sm border border-neutral-800
            rounded-lg px-3 py-2 outline-none focus:border-[#42ffe0]/50 transition-colors duration-200
            placeholder:text-neutral-800 font-sans"
        />
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={`
            px-5 py-2 min-h-[44px] rounded-lg font-mono text-sm font-bold uppercase tracking-wider
            transition-all duration-200 border
            ${isValid && !saving
              ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66] hover:bg-[#00ff66]/20 shadow-[0_0_12px_#00ff6644] hover:shadow-[0_0_20px_#00ff6666] active:scale-95'
              : 'bg-transparent text-neutral-700 border-neutral-800 cursor-not-allowed'
            }
            ${saved ? 'scale-95 bg-[#00ff66]/25' : ''}
          `}
        >
          {saving ? '...' : saved ? '✓ OK' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
