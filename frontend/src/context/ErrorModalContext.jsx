// ============================================================
// ErrorModalContext — Contexto global para errores del servidor
// Uso: const { showError } = useErrorModal();
//      showError('Mensaje de error', 'Título opcional');
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import ErrorModal from '../components/ErrorModal';

const ErrorModalContext = createContext(null);

export function ErrorModalProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
  });

  /**
   * Muestra el modal de error global.
   * @param {string} message - Mensaje de error a mostrar.
   * @param {string} [title] - Título opcional (por defecto "Error del sistema").
   */
  const showError = useCallback((message, title = 'Error del sistema') => {
    setState({ isOpen: true, title, message });
  }, []);

  const closeError = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ErrorModalContext.Provider value={{ showError }}>
      {children}
      <ErrorModal
        isOpen={state.isOpen}
        onClose={closeError}
        title={state.title}
        message={state.message}
      />
    </ErrorModalContext.Provider>
  );
}

/**
 * Hook para usar el modal de errores global en cualquier componente.
 * @returns {{ showError: (message: string, title?: string) => void }}
 */
export function useErrorModal() {
  const ctx = useContext(ErrorModalContext);
  if (!ctx) {
    throw new Error('useErrorModal debe usarse dentro de <ErrorModalProvider>');
  }
  return ctx;
}
