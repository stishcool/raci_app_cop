import { GlobalSearch } from "@/components/features/GlobalSearch";
import { NotificationBell } from "@/components/features/NotificationBell";

function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      {/* Поиск */}
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      {/* Уведомления */}
      <NotificationBell />
    </header>
  );
}

export { Header };
