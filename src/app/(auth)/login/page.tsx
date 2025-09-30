import { LoginForm } from '@/components/auth/login-form';
import { DatabaseProvider } from '@/lib/db';

export default function LoginPage() {
  return (
    <DatabaseProvider>
        <LoginForm />
    </DatabaseProvider>
  )
}
