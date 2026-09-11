import React, { useEffect, useState } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatAction(log: any): string {
  const who = log.user?.name || 'Someone';
  const task = log.task?.title ? `"${log.task.title}"` : 'a task';
  const project = log.project?.name || 'a project';

  switch (log.action) {
    case 'STATUS_CHANGED':
      return `${who} moved ${task} from ${log.previousValue?.replace('_', ' ')} → ${log.newValue?.replace('_', ' ')}`;
    case 'REASSIGNED':
      return `${who} reassigned ${task}`;
    case 'CREATED_TASK':
      return `${who} created task ${task} in ${project}`;
    case 'CREATED_PROJECT':
      return `${who} created project "${log.newValue || project}"`;
    case 'OVERDUE':
      return `${task} was automatically marked as Overdue`;
    default:
      return `${who} performed ${log.action} on ${task}`;
  }
}

export const ActivityFeed: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    api.get('/activity').then(r => setLogs(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (log: any) => setLogs(prev => [log, ...prev].slice(0, 20));
    socket.on('activity', handler);
    return () => { socket.off('activity', handler); };
  }, [socket]);

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Live Activity</CardTitle>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No recent activity</p>
            ) : logs.map(log => (
              <div key={log.id} className="px-5 py-4 transition-colors hover:bg-muted/50">
                <p className="text-sm text-foreground leading-relaxed">{formatAction(log)}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
