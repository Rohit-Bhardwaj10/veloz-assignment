import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import metaRoutes from './routes/meta';
import activityRoutes from './routes/activity';
import notificationRoutes from './routes/notifications';
import statsRoutes from './routes/stats';
import { startCronJobs } from './jobs/cron';

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

export const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

// Track online users: userId → socket count
export const onlineUsers = new Map<string, number>();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', onlineCount: onlineUsers.size });
});

// Socket.io Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret') as any;
    (socket as any).user = payload;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;

  // Track presence
  onlineUsers.set(user.id, (onlineUsers.get(user.id) || 0) + 1);
  io.emit('presence_update', { onlineCount: onlineUsers.size });

  socket.join(`user_${user.id}`);

  socket.on('join_project', (projectId: string) => {
    socket.join(`project_${projectId}`);
  });

  socket.on('leave_project', (projectId: string) => {
    socket.leave(`project_${projectId}`);
  });

  socket.on('disconnect', () => {
    const count = (onlineUsers.get(user.id) || 1) - 1;
    if (count <= 0) {
      onlineUsers.delete(user.id);
    } else {
      onlineUsers.set(user.id, count);
    }
    io.emit('presence_update', { onlineCount: onlineUsers.size });
  });
});

const PORT = process.env.PORT || 3000;
startCronJobs();
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
