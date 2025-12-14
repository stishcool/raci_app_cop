import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Activity } from "lucide-react";
import { adminApi } from "@/api/admin";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { PendingProjects } from "@/components/features/admin/PendingProjects";
import { UserManagement } from "@/components/features/admin/UserManagement";
import { GlobalLogs } from "@/components/features/admin/GlobalLogs";

function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <p className="text-muted-foreground mt-1">
            Управление системой и пользователями
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">
            <Shield className="h-4 w-4 mr-2" />
            Одобрение проектов
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Activity className="h-4 w-4 mr-2" />
            Глобальные логи
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <PendingProjects />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="logs">
          <GlobalLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPage;
