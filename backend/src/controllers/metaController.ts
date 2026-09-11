import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.query.role as string;
    const where = role ? { role: role as any } : {};
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getClients = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
    res.json(clients);
  } catch {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Client name is required' });
      return;
    }
    const client = await prisma.client.create({ data: { name: name.trim() } });
    res.status(201).json(client);
  } catch {
    res.status(500).json({ error: 'Failed to create client' });
  }
};
