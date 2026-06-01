import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dumbbell, Eye, EyeOff, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useErrorModal } from '../context/ErrorModalContext';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

// ─── Campo de formulario con error inline ────────────────────
function FormField({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </label>
      {children}
      {error && (
        <p className="font-mono text-[11px] text-[#ff2d78] mt-0.5 flex items-center gap-1 animate-fade-in">
          <span className="inline-block w-1 h-1 rounded-full bg-[#ff2d78] flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input de contraseña con toggle de visibilidad ───────────
function PasswordInput({ registration, hasError }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        {...registration}
        className={`w-full bg-[#050505] text-white font-sans text-sm border rounded-lg px-4 py-3 pr-10 outline-none transition-colors ${
          hasError
            ? 'border-[#ff2d78]/60 focus:border-[#ff2d78] focus:ring-1 focus:ring-[#ff2d78]/30'
            : 'border-neutral-800 focus:border-[#42ffe0] focus:ring-1 focus:ring-[#42ffe0]/40'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRol, setSelectedRol] = useState('USER');

  const { login, register: registerUser } = useAuth();
  const { showError } = useErrorModal();
  const navigate = useNavigate();

  const schema = isLogin ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { rol: 'USER' },
  });

  const handleRolSelect = (rol) => {
    setSelectedRol(rol);
    setValue('rol', rol, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await login(data.email, data.password);
      } else {
        res = await registerUser(data.nombre, data.email, data.password, data.rol);
      }

      if (res.success) {
        // Redirect based on role stored in AuthContext
        const storedUser = JSON.parse(localStorage.getItem('neonbench_user') || '{}');
        if (storedUser.rol === 'ADMIN') {
          navigate('/dashboard/admin-ia');
        } else {
          navigate('/dashboard/semanas');
        }
      } else {
        showError(res.error, isLogin ? 'Acceso denegado' : 'Error en el registro');
      }
    } catch (err) {
      showError(
        err.serverMessage || 'No se pudo conectar con el servidor. Verifica tu conexión.',
        'Error de conexión'
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setSelectedRol('USER');
    reset({ rol: 'USER' });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00ff66]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#42ffe0]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-sm glass-card rounded-2xl p-8 z-10 border border-[#1a1a1a] shadow-[0_0_40px_#00ff6610]">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 bg-[#00ff66]/10 rounded-2xl border border-[#00ff66]/20">
            <Dumbbell className="text-[#00ff66] drop-shadow-[0_0_8px_#00ff66]" size={36} />
          </div>
          <h1 className="font-mono font-black text-3xl text-[#00ff66] text-glow-green tracking-tight">
            Neon<span className="text-[#42ffe0] text-glow-cyan">Bench</span>
          </h1>
          <p className="font-mono text-xs text-neutral-500 tracking-widest uppercase">
            {isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          {/* Campo Nombre — solo en registro */}
          {!isLogin && (
            <FormField label="Nombre completo" error={errors.nombre?.message}>
              <input
                type="text"
                {...register('nombre')}
                placeholder="Tu nombre"
                className={`bg-[#050505] text-white font-sans text-sm border rounded-lg px-4 py-3 outline-none transition-colors ${
                  errors.nombre
                    ? 'border-[#ff2d78]/60 focus:border-[#ff2d78] focus:ring-1 focus:ring-[#ff2d78]/30'
                    : 'border-neutral-800 focus:border-[#42ffe0] focus:ring-1 focus:ring-[#42ffe0]/40'
                }`}
              />
            </FormField>
          )}

          {/* Campo Email */}
          <FormField label="Email" error={errors.email?.message}>
            <input
              type="email"
              {...register('email')}
              placeholder="usuario@dominio.com"
              className={`bg-[#050505] text-white font-sans text-sm border rounded-lg px-4 py-3 outline-none transition-colors ${
                errors.email
                  ? 'border-[#ff2d78]/60 focus:border-[#ff2d78] focus:ring-1 focus:ring-[#ff2d78]/30'
                  : 'border-neutral-800 focus:border-[#42ffe0] focus:ring-1 focus:ring-[#42ffe0]/40'
              }`}
            />
          </FormField>

          {/* Campo Contraseña */}
          <FormField label="Contraseña" error={errors.password?.message}>
            <PasswordInput
              registration={register('password')}
              hasError={!!errors.password}
            />
            {!isLogin && (
              <p className="font-mono text-[10px] text-neutral-600 mt-1">
                Mínimo 8 caracteres, 1 mayúscula y 1 número.
              </p>
            )}
          </FormField>

          {/* Campo Confirmar Contraseña — solo en registro */}
          {!isLogin && (
            <FormField label="Confirmar contraseña" error={errors.confirmPassword?.message}>
              <PasswordInput
                registration={register('confirmPassword')}
                hasError={!!errors.confirmPassword}
              />
            </FormField>
          )}

          {/* ─── Selector de Rol — solo en registro ─────────── */}
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                Tipo de cuenta
              </label>
              {/* Hidden input for react-hook-form */}
              <input type="hidden" {...register('rol')} value={selectedRol} />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="rol-user-btn"
                  onClick={() => handleRolSelect('USER')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedRol === 'USER'
                      ? 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/60 shadow-[0_0_12px_#00ff6633]'
                      : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  <User size={14} />
                  Cliente
                </button>
                <button
                  type="button"
                  id="rol-admin-btn"
                  onClick={() => handleRolSelect('ADMIN')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedRol === 'ADMIN'
                      ? 'bg-[#ff2d78]/15 text-[#ff2d78] border-[#ff2d78]/60 shadow-[0_0_12px_#ff2d7833]'
                      : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  <Shield size={14} />
                  Admin
                </button>
              </div>
              {errors.rol && (
                <p className="font-mono text-[11px] text-[#ff2d78] flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-[#ff2d78]" />
                  {errors.rol.message}
                </p>
              )}
              {selectedRol === 'ADMIN' && (
                <p className="font-mono text-[10px] text-[#ff2d78]/60 mt-0.5">
                  ⚠️ Modo Administrador: accede a métricas y gestión de usuarios.
                </p>
              )}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            id="submit-auth-btn"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-lg font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 border bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66] hover:bg-[#00ff66]/20 shadow-[0_0_15px_#00ff6633] hover:shadow-[0_0_25px_#00ff6666] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading
              ? 'Procesando...'
              : isLogin
              ? 'Ingresar'
              : 'Crear cuenta'}
          </button>
        </form>

        {/* Cambiar modo */}
        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            className="font-mono text-xs text-neutral-500 hover:text-[#42ffe0] transition-colors"
          >
            {isLogin
              ? '¿No tienes cuenta? Regístrate gratis'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
