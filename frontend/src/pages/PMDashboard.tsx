import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { ActivityFeed } from '../components/ActivityFeed';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { FolderOpen, AlertTriangle, Calendar, TrendingUp, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export const PMDashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { joinProject } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchTasks(); }, [searchParams]);

  const fetchAll = async () => {
    try {
      const [pRes, sRes] = await Promise.all([api.get('/projects'), api.get('/stats')]);
      setProjects(pRes.data);
      setStats(sRes.data);
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
    { label: 'My Projects', value: stats.totalProjects, icon: FolderOpen, color: 'text-zinc-200', bg: 'bg-zinc-500/10' },
    { label: 'Due This Week', value: stats.dueSoon, icon: Calendar, color: 'text-zinc-300', bg: 'bg-zinc-500/10' },
    { label: 'Overdue Tasks', value: stats.overdueCount, icon: AlertTriangle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Project Manager Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage your team's projects and tasks.</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{card.value ?? '—'}</div>
                <div className="text-sm font-medium text-muted-foreground">{card.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks by Priority */}
      {stats?.tasksByPriority && stats.tasksByPriority.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tasks by Priority
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.tasksByPriority.map((p: any) => (
                <Badge 
                  key={p.priority} 
                  variant="outline" 
                  className={`px-3 py-1 text-sm font-medium ${priorityStyles[p.priority] || priorityStyles.LOW}`}
                >
                  {p.priority} <span className="ml-2 font-bold opacity-70">{p.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg">My Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[220px]">
                <div className="divide-y divide-border">
                  {projects.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">No projects yet — create one!</p>
                  ) : projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.client?.name} · {p._count?.tasks ?? 0} tasks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="shadow-sm flex flex-col">
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
                      <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>
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
              <ScrollArea className="h-[320px]">
                <div className="divide-y divide-border">
                  {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No tasks found</p>
                  ) : tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="font-medium text-foreground truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {t.project?.name} · Due {new Date(t.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={priorityStyles[t.priority] || priorityStyles.LOW}>{t.priority}</Badge>
                        <Badge variant="outline" className={statusStyles[t.status] || statusStyles.TODO}>{t.status.replace('_',' ')}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1 h-full">
          <ActivityFeed />
        </div>
      </div>

      <CreateProjectModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)}
        onCreated={(p) => setProjects(prev => [p, ...prev])} />
      <CreateTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)}
        onCreated={(t) => setTasks(prev => [t, ...prev])} projects={projects} />
    </div>
  );
};
