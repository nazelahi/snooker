import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export function withJWT(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = auth.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // @ts-ignore
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
} 