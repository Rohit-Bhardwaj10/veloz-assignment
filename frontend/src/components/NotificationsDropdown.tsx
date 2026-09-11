import React, { useEffect, useState } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const NotificationsDropdown: React.FC = () => {
  const [notifs, setNotifs] = useState<any[]>([]);
  const { socket } = useSocket();

  const unreadCount = notifs.filter(n => !n.isRead).length;

  useEffect(() => {
    api.get('/notifications').then(r => setNotifs(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (notif: any) => setNotifs(prev => [notif, ...prev]);
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [socket]);

  const markOne = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAll = async () => {
    try {
      await api.patch('/notifications/all');
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} className="h-auto text-xs py-1 px-2 text-primary">
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-72">
          <div className="divide-y divide-border">
            {notifs.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No notifications</p>
            ) : notifs.map(n => (
              <div 
                key={n.id} 
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                  !n.isRead && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  n.isRead ? "bg-muted-foreground/30" : "bg-primary"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0 mt-0.5 text-muted-foreground hover:text-primary"
                    onClick={() => markOne(n.id)}
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
