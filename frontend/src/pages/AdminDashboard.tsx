import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { ActivityFeed } from '../components/ActivityFeed';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { LayoutDashboard, FolderOpen, AlertTriangle, Wifi, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

export const priorityStyles: Record<string, string> = {
  LOW: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
  MEDIUM: 'bg-amber-950/30 text-amber-200/70 border-amber-900/30',
  HIGH: 'bg-orange-950/30 text-orange-200/70 border-orange-900/30',
  CRITICAL: 'bg-red-950/30 text-red-200/70 border-red-900/30',
};

export const statusStyles: Record<string, string> = {
  TODO: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
  IN_PROGRESS: 'bg-amber-950/30 text-amber-200/70 border-amber-900/30',
  IN_REVIEW: 'bg-orange-950/30 text-orange-200/70 border-orange-900/30',
  DONE: 'bg-emerald-950/30 text-emerald-200/70 border-emerald-900/30',
  OVERDUE: 'bg-red-950/30 text-red-200/70 border-red-900/30',
};

export const AdminDashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { joinProject, socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [searchParams]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_project', 'admin_feed'); // join global admin room
    socket.on('presence_update', ({ onlineCount: cnt }: any) => setOnlineCount(cnt));
    return () => { socket.off('presence_update'); };
  }, [socket]);

  const fetchAll = async () => {
    try {
      const [pRes, sRes] = await Promise.all([api.get('/projects'), api.get('/stats')]);
      setProjects(pRes.data);
      setStats(sRes.data);
      setOnlineCount(sRes.data.onlineCount || 0);
      pRes.data.forEach((p: any) => joinProject(p.id));
    } catch {}
  };

  const fetchTasks = async () => {
    try {
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');
      let url = '/tasks?';
      if (status) url += `status=${status}&`;
      if (priority) url += `priority=${priority}&`;
      const res = await api.get(url);
      setTasks(res.data);
    } catch {}
  };

  const updateSearchParam = (key: string, value: string) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (value && value !== 'all') p.set(key, value);
      else p.delete(key);
      return p;
    });
  };

  const statCards = stats ? [
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderOpen, color: 'text-zinc-200', bg: 'bg-zinc-500/10' },
    { label: 'Total Clients', value: stats.totalClients, icon: LayoutDashboard, color: 'text-zinc-300', bg: 'bg-zinc-500/10' },
    { label: 'Overdue Tasks', value: stats.overdueCount, icon: AlertTriangle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    { label: 'Users Online', value: onlineCount, icon: Wifi, color: 'text-zinc-100', bg: 'bg-zinc-500/10' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of all agency activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowProjectModal(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
          <Button onClick={() => setShowTaskModal(true)} variant="secondary">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value ?? '—'}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks by status breakdown */}
      {stats?.tasksByStatus && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Task Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.tasksByStatus.map((s: any) => (
                <Badge 
                  key={s.status} 
                  variant="outline"
                  className={`px-3 py-1 text-sm font-medium ${statusStyles[s.status] || statusStyles.TODO}`}
                >
                  {s.status.replace('_', ' ')} <span className="ml-2 font-bold opacity-70">{s.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">All Tasks</CardTitle>
            <div className="flex items-center gap-2">
              <Select 
                value={searchParams.get('status') || 'all'} 
                onValueChange={(v) => updateSearchParam('status', v)}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {['TODO','IN_PROGRESS','IN_REVIEW','DONE','OVERDUE'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={searchParams.get('priority') || 'all'} 
                onValueChange={(v) => updateSearchParam('priority', v)}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border">
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No tasks found</p>
                ) : tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-medium text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {t.project?.name} · {t.developer?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={priorityStyles[t.priority] || priorityStyles.LOW}>{t.priority}</Badge>
                      <Badge variant="outline" className={statusStyles[t.status] || statusStyles.TODO}>{t.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <div className="lg:col-span-1 h-[470px]">
          <ActivityFeed />
        </div>
      </div>

      {/* Projects */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Projects currently managed by the agency.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <Card key={p.id} className="border border-border shadow-none hover:border-primary/50 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Client:</span> {p.client?.name}</p>
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">PM:</span> {p.manager?.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">{p._count?.tasks ?? 0} tasks</p>
                </CardContent>
              </Card>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No projects found. Create one to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateProjectModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)}
        onCreated={(p) => setProjects(prev => [p, ...prev])} />
      <CreateTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)}
        onCreated={(t) => setTasks(prev => [t, ...prev])} projects={projects} />
    </div>
  );
};
