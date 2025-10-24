import React, { useState } from 'react';
import axios from 'axios'; // Importar Axios
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Bus, Loader2 } from 'lucide-react'; // Adicionar Loader2 para feedback
import { Alert, AlertDescription } from './ui/alert'; // Para mostrar erros

interface LoginPageProps {
  onLogin: (username: string, token: string) => void; // Atualizar onLogin para receber token
}

// URL da sua API (ajuste se necessário)
const API_URL = 'http://localhost:8080';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Estado para erro
  const [isLoading, setIsLoading] = useState(false); // Estado para loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Limpa erros anteriores
    setIsLoading(true); // Ativa o loading

    try {
      // Faz a chamada POST para o backend
      const response = await axios.post(`${API_URL}/login`, {
        username: username,
        password: password,
      });

      // Se a resposta for OK (2xx)
      if (response.data && response.data.token) {
        const token = response.data.token;
        // console.log('Login bem-sucedido, token:', token); // Para debug

        // Armazena o token no localStorage (IMPORTANTE!)
        localStorage.setItem('authToken', token);

        // Chama a função onLogin passando o username e o token
        onLogin(username, token);
      } else {
        // Resposta inesperada do backend
        setError('Erro ao fazer login: resposta inválida do servidor.');
      }

    } catch (err: any) {
      // Se der erro (ex: 401 Unauthorized, erro de rede)
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 401) {
          setError('Usuário ou senha inválidos.');
        } else {
          setError(`Erro ${err.response.status}: ${err.response.data?.message || 'Erro no servidor'}`);
        }
      } else {
        // Outros erros (rede, etc.)
        setError('Erro de conexão. Verifique sua rede ou se o servidor está online.');
      }
      console.error('Erro no login:', err); // Para debug
    } finally {
      setIsLoading(false); // Desativa o loading, mesmo se der erro
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            {/* ... (Ícone e título) ... */}
            <div className="bg-primary rounded-full p-4 mb-4">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-primary">Transport Management</h1>
            <p className="text-muted-foreground mt-2">Sign in to your account</p>
          </div>

          {/* Exibe mensagem de erro se houver */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... (Campos de Username e Password) ... */}
             <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-gray-300"
                disabled={isLoading} // Desabilita durante o loading
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300"
                disabled={isLoading} // Desabilita durante o loading
              />
            </div>


            {/* ... (Link "Forgot password?") ... */}
             <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-primary hover:underline text-sm" // Ajuste de tamanho opcional
                onClick={() => alert('Password reset functionality would be implemented here')}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>


            {/* Botão de Sign In com indicador de loading */}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* ... (Mensagem Demo Credentials) ... */}
           <div className="mt-6 text-center text-muted-foreground text-sm">
            <p>Use credentials: user / senha123</p> {/* Exemplo de credenciais */}
          </div>

        </div>
      </div>
    </div>
  );
}