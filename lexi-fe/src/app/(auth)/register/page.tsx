import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">LexiFluent</h1>
          <p className="text-muted-foreground mt-2">Bắt đầu hành trình luyện viết của bạn</p>
        </div>
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Tạo tài khoản</h2>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
