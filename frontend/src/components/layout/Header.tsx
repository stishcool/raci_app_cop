import { Bell } from "lucide-react";
import { GlobalSearch } from "@/components/features/GlobalSearch";


function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      {/* Поиск */}
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>


      {/* Уведомления */}
      <button className="relative rounded-lg p-2 hover:bg-accent transition-colors">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
      </button>
    </header>
  );
}


export { Header };
