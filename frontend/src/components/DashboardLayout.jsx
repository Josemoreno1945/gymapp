import { Outlet, NavLink, Navigate } from 'react-router-dom';
import Header from './Header';
import { Calendar, List, TrendingUp, Bot, Users, BrainCircuit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const USER_NAV = [
  { to: '/dashboard/semanas',   icon: Calendar,     label: 'Semanas' },
  { to: '/dashboard/ejercicios', icon: List,         label: 'Ejercicios' },
  { to: '/dashboard/metricas',  icon: TrendingUp,   label: 'Métricas' },
  { to: '/dashboard/agente-ia', icon: Bot,           label: 'Agente IA' },
];

const ADMIN_NAV = [
  { to: '/dashboard/usuarios',  icon: Users,         label: 'Usuarios' },
  { to: '/dashboard/admin-ia',  icon: BrainCircuit,  label: 'NEXUS IA' },
];

export default function DashboardLayout() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden max-w-6xl w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-16 md:w-56 border-r border-neutral-900 bg-black/50 backdrop-blur-sm py-6 px-2 flex flex-col gap-3">
          {/* Role badge */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border text-[10px] font-mono uppercase tracking-widest ${
            isAdmin
              ? 'bg-[#ff2d78]/10 text-[#ff2d78] border-[#ff2d78]/20'
              : 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-[#ff2d78]' : 'bg-[#00ff66]'} animate-pulse`} />
            {isAdmin ? 'Admin' : 'Cliente'}
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 font-mono text-sm ${
                  isActive
                    ? isAdmin
                      ? 'bg-[#ff2d78]/10 text-[#ff2d78] border border-[#ff2d78]/50 shadow-[0_0_12px_#ff2d7833]'
                      : 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/50 shadow-[0_0_12px_#00ff6633]'
                    : 'text-neutral-500 hover:text-[#42ffe0] hover:bg-[#42ffe0]/5 border border-transparent'
                }`
              }
              title={item.label}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={20}
                    className={isActive ? (isAdmin ? 'drop-shadow-[0_0_8px_#ff2d78]' : 'drop-shadow-[0_0_8px_#00ff66]') : ''}
                  />
                  <span className="hidden md:inline-block tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
