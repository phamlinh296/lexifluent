import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">LexiFluent</h1>
          <p className="text-muted-foreground mt-2">AI Writing Coach cá nhân của bạn</p>
        </div>
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Đăng nhập</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
