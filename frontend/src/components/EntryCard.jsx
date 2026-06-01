import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../api/client';

export default function EntryCard({ entry, unit, onDelete }) {
  const time = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="animate-slide-in flex items-center gap-3 glass-card rounded-lg px-4 py-3
      border border-neutral-900 hover:border-neutral-700 transition-all duration-200 group">

      {/* Volume badge */}
      <div className="flex-shrink-0 w-14 text-center">
        <span className="font-mono text-xs text-neutral-700 block">vol</span>
        <span className="font-mono font-bold text-[#bf5af2] text-sm">
          {entry.volumen ?? 0}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-neutral-800 flex-shrink-0" />

      {/* Stats */}
      <div className="flex gap-3 flex-1 flex-wrap min-w-0">
        <StatPill label="S" value={entry.series} color="green" />
        <StatPill label="R" value={entry.repeticiones} color="cyan" />
        <StatPill label={entry.unidad} value={entry.peso} color="pink" />
        {entry.ejercicio && (
          <span className="text-neutral-300 font-bold text-xs self-center ml-2 uppercase tracking-wide">
            {entry.ejercicio}
          </span>
        )}
        {entry.nota && (
          <span className="text-neutral-500 text-xs self-center truncate max-w-[160px]" title={entry.nota}>
            — {entry.nota}
          </span>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-neutral-800 font-mono text-[10px] flex-shrink-0">{time}</span>

      {/* Delete button */}
      <button
        onClick={() => onDelete(entry.id)}
        title="Eliminar entrada"
        className="flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 text-neutral-700
          hover:text-[#ff2d78] transition-all duration-200 hover:drop-shadow-[0_0_4px_#ff2d78] min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function StatPill({ label, value, color }) {
  const colors = {
    green: 'text-[#00ff66]',
    cyan:  'text-[#42ffe0]',
    pink:  'text-[#ff2d78]',
  };
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-mono text-[10px] text-neutral-700 uppercase">{label}</span>
      <span className={`font-mono font-bold text-sm ${colors[color]}`}>{value}</span>
    </div>
  );
}
