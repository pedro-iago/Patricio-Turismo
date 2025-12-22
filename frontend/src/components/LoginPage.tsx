import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bus } from 'lucide-react';
import api from '@/services/api';
import { AxiosError } from 'axios';
import logo from '../assets/logo.png';

interface LoginPageProps {
  onLogin: (username: string) => void; 
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // [CORREÇÃO] 1. Força o fechamento do teclado no iPhone
    (document.activeElement as HTMLElement)?.blur();

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', {
        username: username,
        password: password
      });

      // [CORREÇÃO] 2. Reseta a posição da tela para o topo
      // Isso impede que o Safari fique "deslocado" após o teclado fechar
      window.scrollTo(0, 0);

      const loggedInUsername = response.data; 
      onLogin(loggedInUsername); 

    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response && (axiosError.response.status === 401 || axiosError.response.status === 403)) {
        setError('Usuário ou senha inválidos.');
      } else {
        setError('Não foi possível conectar ao servidor. Verifique o console.');
      }
      console.error("Erro no login:", err);
      setIsLoading(false);
    }
  };

  return (
    // Usei min-h-screen aqui, mas o globals.css vai travar o html/body
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="p-0 mb-1">
              <img src={logo} alt="Logo da Empresa" className="w-auto" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Digite sua senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}