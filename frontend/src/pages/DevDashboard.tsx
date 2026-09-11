import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { ActivityFeed } from '../components/ActivityFeed';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export const DevDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { joinProject } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchTasks(); }, [searchParams]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data);
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
      const ids = new Set(res.data.map((t: any) => t.projectId));
      ids.forEach((id: any) => joinProject(id));
    } catch {}
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: res.data.status } : t));
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
    { label: 'Total Assigned', value: stats.totalTasks, icon: CheckCircle, color: 'text-zinc-200', bg: 'bg-zinc-500/10' },
    { label: 'Overdue', value: stats.overdueCount, icon: AlertTriangle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    { label: 'In Progress', value: stats.tasksByStatus?.find((s: any) => s.status === 'IN_PROGRESS')?.count ?? 0, icon: Clock, color: 'text-zinc-300', bg: 'bg-zinc-500/10' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Developer Dashboard</h2>
        <p className="text-muted-foreground mt-1">Focus on your assigned tasks and updates.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">My Tasks</CardTitle>
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
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border">
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-10">No tasks assigned to you</p>
                ) : tasks.map(t => (
                  <div key={t.id} className="p-5 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-base">{t.title}</p>
                        {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge variant="outline" className={priorityStyles[t.priority] || priorityStyles.LOW}>{t.priority}</Badge>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{t.project?.name}</span>
                          <span className="text-xs text-muted-foreground">Due {new Date(t.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="shrink-0 sm:w-36">
                        <Select 
                          value={t.status} 
                          onValueChange={(v) => updateStatus(t.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODO">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="DONE">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <div className="lg:col-span-1 h-[670px]">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
