import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/logo.png';

function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/admin');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-900 to-red-900">
      {/* Padrão de fundo */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(30deg, #dc2626 12%, transparent 12.5%, transparent 87%, #dc2626 87.5%, #dc2626),
            linear-gradient(150deg, #dc2626 12%, transparent 12.5%, transparent 87%, #dc2626 87.5%, #dc2626),
            linear-gradient(30deg, #dc2626 12%, transparent 12.5%, transparent 87%, #dc2626 87.5%, #dc2626),
            linear-gradient(150deg, #dc2626 12%, transparent 12.5%, transparent 87%, #dc2626 87.5%, #dc2626),
            linear-gradient(60deg, #dc262677 25%, transparent 25.5%, transparent 75%, #dc262677 75%, #dc262677)`,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0'
        }} />
      </div>

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900/80" />

      {/* Brilho superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/3 bg-red-500 opacity-20 blur-3xl" />

      {/* Card de login */}
      <div className="relative max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="flex flex-col items-center mb-8">
            <img
              src={logoImg}
              alt="Logo"
              className="h-32 w-auto mb-4 drop-shadow-xl"
            />
            <h1 className="text-2xl font-bold text-white">Área Administrativa</h1>
            <p className="text-gray-300 mt-2">Acesse sua conta para gerenciar os pedidos</p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#dc2626',
                    brandAccent: '#b91c1c',
                  }
                }
              },
              className: {
                container: 'auth-container',
                button: '!bg-red-500 hover:!bg-red-600',
                input: 'rounded-lg !border-white/20 !bg-white/10 !text-white placeholder:text-gray-400',
                label: '!text-gray-300',
                message: '!text-gray-300'
              }
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  email_input_placeholder: 'Seu email',
                  password_input_placeholder: 'Sua senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  social_provider_text: 'Entrar com {{provider}}',
                  link_text: 'Já tem uma conta? Entre'
                }
              }
            }}
            providers={[]}
            view="sign_in"
            showLinks={false}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;