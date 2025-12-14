import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  Shield,
  Moon,
  Sun,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/contexts/ThemeContext";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";


const navigation = [
  { name: "Дашборд", href: "/", icon: LayoutDashboard },
  { name: "Проекты", href: "/projects", icon: FolderKanban },
  { name: "Профиль", href: "/profile", icon: Users },
];


const adminNavigation = [
  { name: "Администрирование", href: "/admin", icon: Shield },
];


function Sidebar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();


  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };


  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border">
      {/* Лого */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <h1 className="text-xl font-bold text-primary">RACI CRM</h1>
      </div>


      {/* Навигация */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}


        {/* Админ раздел */}
        {user?.system_role === "ADMIN" && (
          <>
            <div className="my-4 border-t border-border" />
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>


      {/* Профиль и выход */}
      <div className="mt-auto border-t border-border">
        {/* Переключатель темы */}
        <div className="px-3 py-3">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {theme === "light" ? (
              <>
                <Moon className="h-5 w-5" />
                Темная тема
              </>
            ) : (
              <>
                <Sun className="h-5 w-5" />
                Светлая тема
              </>
            )}
          </button>
        </div>

        {/* User info */}
        <div className="px-3 pb-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Avatar
              src={user?.avatar}
              fallback={`${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || user?.username}
              </p>
            </div>
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-2"
          >
            <LogOut className="h-5 w-5" />
            Выход
          </button>
        </div>
      </div>
    </div>
  );
}


export { Sidebar };
