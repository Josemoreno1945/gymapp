// ============================================================
// ErrorModal — Modal reutilizable para errores globales/servidor
// Mismo diseño visual que ConfirmModal (paleta #ff2d78)
// Props: isOpen, onClose, title, message
// ============================================================

import { AlertTriangle, X } from 'lucide-react';

export default function ErrorModal({ isOpen, onClose, title, message }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-sm rounded-xl border border-neutral-800 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent — misma barra roja que ConfirmModal */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff2d78]" />

        <div className="p-6">
          {/* Título */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#ff2d78]/10 text-[#ff2d78] rounded-full flex-shrink-0">
                <AlertTriangle size={22} />
              </div>
              <h3 className="font-mono font-bold text-base text-white leading-snug">
                {title || 'Error del sistema'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-600 hover:text-neutral-300 transition-colors flex-shrink-0 -mt-4 -mr-1"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mensaje */}
          <p className="font-mono text-sm text-neutral-400 mb-6 leading-relaxed pl-[52px]">
            {message || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'}
          </p>

          {/* Botón cerrar */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 font-mono text-sm bg-[#ff2d78]/10 text-[#ff2d78] border border-[#ff2d78]/40 font-bold rounded-lg hover:bg-[#ff2d78]/20 hover:shadow-[0_0_15px_#ff2d7844] transition-all active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
