import { RegisterForm } from '@/components/auth/register-form';
import { DatabaseProvider } from '@/lib/db-provider';

export default function RegisterPage() {
    return (
        <DatabaseProvider>
            <RegisterForm />
        </DatabaseProvider>
    );
}
