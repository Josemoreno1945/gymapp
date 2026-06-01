import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from local storage
    const storedToken = localStorage.getItem('neonbench_token');
    const storedUser = localStorage.getItem('neonbench_user');
    const storedSession = localStorage.getItem('neonbench_session');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setSessionId(storedSession);
    }
    setLoading(false);

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, usuario: newUser, session_id } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      setSessionId(session_id);
      
      localStorage.setItem('neonbench_token', newToken);
      localStorage.setItem('neonbench_user', JSON.stringify(newUser));
      localStorage.setItem('neonbench_session', session_id);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (nombre, email, password, rol = 'USER') => {
    try {
      const response = await api.post('/auth/register', { nombre, email, password, rol });
      const { token: newToken, usuario: newUser, session_id } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      setSessionId(session_id);
      
      localStorage.setItem('neonbench_token', newToken);
      localStorage.setItem('neonbench_user', JSON.stringify(newUser));
      localStorage.setItem('neonbench_session', session_id);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al registrarse' 
      };
    }
  };

  const logout = async () => {
    try {
      if (token && sessionId) {
        await api.post('/auth/logout', { session_id: sessionId });
      }
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      setToken(null);
      setUser(null);
      setSessionId(null);
      localStorage.removeItem('neonbench_token');
      localStorage.removeItem('neonbench_user');
      localStorage.removeItem('neonbench_session');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
