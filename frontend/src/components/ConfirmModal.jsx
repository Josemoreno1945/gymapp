import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-sm rounded-xl border border-neutral-800 shadow-2xl relative overflow-hidden">
        {/* Header accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff2d78]" />
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#ff2d78]/10 text-[#ff2d78] rounded-full">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-mono font-bold text-lg text-white">{title || 'Confirmar acción'}</h3>
          </div>
          
          <p className="font-mono text-sm text-neutral-400 mb-6 leading-relaxed">
            {message || '¿Seguro que desea eliminar este elemento? Esta acción no se puede deshacer.'}
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-mono text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 font-mono text-sm bg-[#ff2d78] text-white font-bold rounded-lg hover:bg-[#ff2d78]/80 hover:shadow-[0_0_15px_#ff2d7866] transition-all active:scale-95"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
