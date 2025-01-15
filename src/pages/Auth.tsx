import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import logoImg from '../assets/logo.png';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!name || !phone) {
        toast.error('Preencha todos os campos');
        return;
      }

      if (isLogin) {
        // Tentar fazer login
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('phone', phone)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast.error('Usuário não encontrado');
          } else {
            throw error;
          }
          return;
        }

        if (user.name.toLowerCase() !== name.toLowerCase()) {
          toast.error('Nome incorreto');
          return;
        }

        // Login bem sucedido
        const { error: sessionError } = await supabase.auth.signInWithPassword({
          email: `${phone}@temp.com`,
          password: phone // Usando o telefone como senha temporária
        });

        if (sessionError) throw sessionError;

        localStorage.setItem('user', JSON.stringify(user));
        toast.success('Login realizado com sucesso!');
        navigate('/');
      } else {
        // Verificar se já existe usuário com este telefone
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('phone', phone)
          .single();

        if (existingUser) {
          toast.error('Este número de telefone já está cadastrado');
          return;
        }

        // Criar novo usuário no auth
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${phone}@temp.com`,
          password: phone,
        });

        if (signUpError) throw signUpError;

        // Criar usuário na tabela users
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ name, phone }])
          .select()
          .single();

        if (createError) throw createError;

        localStorage.setItem('user', JSON.stringify(newUser));
        toast.success('Conta criada com sucesso!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotUser = async () => {
    const phoneNumber = prompt('Digite seu número de telefone:');
    if (!phoneNumber) return;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('name')
        .eq('phone', phoneNumber)
        .single();

      if (error) {
        toast.error('Usuário não encontrado');
        return;
      }

      toast.success(`Seu nome de usuário é: ${user.name}`);
    } catch (error) {
      toast.error('Erro ao recuperar usuário');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          src={logoImg}
          alt="Logo"
          className="mx-auto h-32 w-auto"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Entrar no Cardápio' : 'Criar Conta'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin 
            ? 'Acesse o cardápio digital para fazer seu pedido' 
            : 'Crie sua conta para fazer pedidos'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
              </button>

              <div className="flex flex-col gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-gray-600 hover:text-red-500"
                >
                  {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                </button>

                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotUser}
                    className="text-sm text-gray-600 hover:text-red-500"
                  >
                    Esqueceu seu nome?
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
