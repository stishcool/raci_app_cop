import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";

interface LoginForm {
  username: string;
  password: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await authApi.login(data.username, data.password);
      setAuth(response.user, response.access_token);
      
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Ошибка авторизации. Проверьте данные."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              RACI CRM
            </h1>
            <p className="text-muted-foreground">
              Войдите в систему управления проектами
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="ivan"
                {...register("username", {
                  required: "Введите имя пользователя",
                })}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "Введите пароль",
                  minLength: {
                    value: 6,
                    message: "Минимум 6 символов",
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Ошибка от сервера */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Кнопка входа */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>

          {/* Тестовые данные */}
          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              Тестовые данные для входа:
            </p>
            <div className="space-y-1 text-xs font-mono">
              <p>👤 Admin: <span className="text-primary">admin / admin123</span></p>
              <p>👤 User: <span className="text-primary">ivanov / password123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
