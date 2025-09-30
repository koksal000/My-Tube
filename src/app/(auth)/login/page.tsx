import { LoginForm } from '@/components/auth/login-form';
import { DatabaseProvider } from '@/lib/db-provider';

export default function LoginPage() {
  return (
    <DatabaseProvider>
        <LoginForm />
    </DatabaseProvider>
  )
}
