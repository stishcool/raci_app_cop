import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Mail, Phone, Lock, Upload } from "lucide-react";
import { profileApi } from "@/api/profile";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
    initialData: user || undefined,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
    },
  });

  useEffect(() => {
    if (profile) {
      resetProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, resetProfile]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>();

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      const token = useAuthStore.getState().token;
      if (token) {
        setAuth(data, token);
      }
      toast.success("Данные обновлены!");
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || error.message || "Ошибка при обновлении");
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      console.log("Mutation function called with:", file.name);
      return profileApi.uploadAvatar(file);
    },
    onSuccess: (avatarUrl) => {
      console.log("✅ Success! Avatar URL:", avatarUrl);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Аватар загружен!");
      setAvatarPreview(null);
    },
    onError: (error: any) => {
      console.error("❌ Error uploading avatar:", error);
      console.error("Error response:", error.response);
      toast.error(error.response?.data?.message || "Ошибка при загрузке аватара");
      setAvatarPreview(null);
    },
  });

  const onSubmitProfile = (data: ProfileForm) => {
    console.log("Submitting profile data:", data);
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordForm) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Пароли не совпадают");
      return;
    }
    
    updateProfileMutation.mutate({
      current_password: data.current_password,
      new_password: data.new_password,
    });
    resetPassword();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed");
    const file = e.target.files?.[0];

    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name, file.size, file.type);

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 5MB");
      return;
    }

    console.log("Creating preview...");
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("Preview ready");
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    console.log("Starting upload...");
    uploadAvatarMutation.mutate(file);
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Профиль</h1>
        <p className="text-muted-foreground mt-1">
          Управление личными данными и настройками
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar - Аватар и основная информация */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              {/* Аватар */}
              <div className="relative mb-4">
                <Avatar
                  src={avatarPreview || profile?.avatar}
                  fallback={`${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`}
                  size="xl"
                  className="border-4 border-background shadow-lg"
                />

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-card border-2 border-background hover:bg-accent transition-colors shadow-md"
                  title="Загрузить аватар"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadAvatarMutation.isPending}
                  />
                </label>
              </div>
              {/* Имя и роль */}
              <h3 className="text-xl font-semibold text-center mb-1">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">@{profile?.username}</p>
              <Badge>{profile?.system_role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Основная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Имя */}
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      Имя <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      placeholder={profile?.first_name}
                      {...registerProfile("first_name", {
                        required: "Введите имя",
                      })}
                    />
                    {profileErrors.first_name && (
                      <p className="text-sm text-destructive">
                        {profileErrors.first_name.message}
                      </p>
                    )}
                  </div>

                  {/* Фамилия */}
                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Фамилия <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      placeholder={profile?.last_name}
                      {...registerProfile("last_name", {
                        required: "Введите фамилию",
                      })}
                    />
                    {profileErrors.last_name && (
                      <p className="text-sm text-destructive">
                        {profileErrors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      placeholder={profile?.email || "email@example.com"}
                      {...registerProfile("email")}
                    />
                  </div>
                </div>

                {/* Телефон */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      placeholder={profile?.phone || "+7 999 123 45 67"}
                      {...registerProfile("phone")}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Смена пароля */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Смена пароля</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                {/* Текущий пароль */}
                <div className="space-y-2">
                  <Label htmlFor="current_password">
                    Текущий пароль <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current_password"
                      type="password"
                      className="pl-10"
                      {...registerPassword("current_password", {
                        required: "Введите текущий пароль",
                      })}
                    />
                  </div>
                  {passwordErrors.current_password && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.current_password.message}
                    </p>
                  )}
                </div>

                {/* Новый пароль */}
                <div className="space-y-2">
                  <Label htmlFor="new_password">
                    Новый пароль <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new_password"
                      type="password"
                      className="pl-10"
                      {...registerPassword("new_password", {
                        required: "Введите новый пароль",
                        minLength: {
                          value: 6,
                          message: "Минимум 6 символов",
                        },
                      })}
                    />
                  </div>
                  {passwordErrors.new_password && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.new_password.message}
                    </p>
                  )}
                </div>

                {/* Подтверждение пароля */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">
                    Подтвердите пароль <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm_password"
                      type="password"
                      className="pl-10"
                      {...registerPassword("confirm_password", {
                        required: "Подтвердите пароль",
                      })}
                    />
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.confirm_password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Изменение..." : "Изменить пароль"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage
