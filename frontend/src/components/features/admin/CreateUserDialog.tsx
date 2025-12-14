import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/api/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { UserPlus, RefreshCw, Eye, EyeOff } from "lucide-react";


interface CreateUserFormData {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  system_role?: "TEAM_MEMBER" | "PROJECT_MANAGER" | "ADMIN";
  is_active?: boolean;
}


interface CreateUserDialogProps {
  trigger?: React.ReactNode;
}


export function CreateUserDialog({ trigger }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    defaultValues: {
      system_role: "TEAM_MEMBER",
      is_active: true,
    },
  });

  const username = watch("username");


  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => adminApi.createUser(data),
    onSuccess: () => {
      toast.success("Пользователь успешно создан");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      reset();
      setShowPassword(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Ошибка при создании пользователя"
      );
    },
  });


  const generatePassword = () => {
    const length = 12;
    const charset = {
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      numbers: "0123456789",
      symbols: "!@#$%^&*",
    };


    const allChars =
      charset.lowercase +
      charset.uppercase +
      charset.numbers +
      charset.symbols;


    let password = "";
    
    password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
    password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];


    const array = new Uint8Array(length - 4);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < array.length; i++) {
      password += allChars[array[i] % allChars.length];
    }


    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");


    setValue("password", password);
    setShowPassword(true);
    toast.success("Пароль сгенерирован");
  };


  const onSubmit = (data: CreateUserFormData) => {
    const payload: any = {
        username: data.username,
        password: data.password,
    };

    if (data.email && data.email.trim() !== '') {
        payload.email = data.email.trim();
    }

    if (data.first_name && data.first_name.trim() !== '') {
        payload.first_name = data.first_name.trim();
    }

    if (data.last_name && data.last_name.trim() !== '') {
        payload.last_name = data.last_name.trim();
    }

    if (data.phone && data.phone.trim() !== '') {
        payload.phone = data.phone.trim();
    }

    if (data.system_role) {
        payload.system_role = data.system_role;
    }

    console.log('Отправляемый payload:', JSON.stringify(payload, null, 2));
    
    createUserMutation.mutate(payload);
    };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Добавить пользователя
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание нового пользователя</DialogTitle>
          <DialogDescription>
            Заполните обязательные поля. Остальные поля будут заполнены значениями по умолчанию.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Username - ОБЯЗАТЕЛЬНО */}
            <div className="grid gap-2">
              <Label htmlFor="username">
                Логин <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                {...register("username", {
                  required: "Логин обязателен",
                  minLength: {
                    value: 3,
                    message: "Минимум 3 символа",
                  },
                })}
                placeholder="username"
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>


            {/* Password - ОБЯЗАТЕЛЬНО */}
            <div className="grid gap-2">
              <Label htmlFor="password">
                Пароль <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Пароль обязателен",
                      minLength: {
                        value: 6,
                        message: "Минимум 6 символов",
                      },
                    })}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  title="Сгенерировать пароль"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>


            {/* Опциональные поля */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Необязательные поля (будут установлены значения по умолчанию)
              </p>


              {/* Email */}
              <div className="grid gap-2 mb-3">
                <Label htmlFor="email">
                  Email
                  <span className="text-xs text-muted-foreground ml-2">
                    (по умолчанию: {username || "username"}@example.com)
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Некорректный email",
                    },
                  })}
                  placeholder={`${username || "username"}@example.com`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>


              {/* First Name */}
              <div className="grid gap-2 mb-3">
                <Label htmlFor="first_name">
                  Имя
                  <span className="text-xs text-muted-foreground ml-2">
                    (по умолчанию: New)
                  </span>
                </Label>
                <Input
                  id="first_name"
                  {...register("first_name")}
                  placeholder="New"
                />
              </div>


              {/* Last Name */}
              <div className="grid gap-2 mb-3">
                <Label htmlFor="last_name">
                  Фамилия
                  <span className="text-xs text-muted-foreground ml-2">
                    (по умолчанию: User)
                  </span>
                </Label>
                <Input
                  id="last_name"
                  {...register("last_name")}
                  placeholder="User"
                />
              </div>


              {/* Phone */}
              <div className="grid gap-2 mb-3">
                <Label htmlFor="phone">
                  Телефон
                  <span className="text-xs text-muted-foreground ml-2">
                    (необязательно)
                  </span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="+7 999 999 99 99"
                />
              </div>


              {/* Role */}
              <div className="grid gap-2">
                <Label htmlFor="system_role">
                  Роль
                  <span className="text-xs text-muted-foreground ml-2">
                    (по умолчанию: Участник команды)
                  </span>
                </Label>
                <select
                  id="system_role"
                  {...register("system_role")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="TEAM_MEMBER">Участник команды</option>
                  <option value="PROJECT_MANAGER">Менеджер проекта</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
            </div>
          </div>


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
                setShowPassword(false);
              }}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
