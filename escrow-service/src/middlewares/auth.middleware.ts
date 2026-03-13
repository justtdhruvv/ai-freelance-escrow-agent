import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access token is required. Format: Authorization: Bearer <token>'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const user = verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid or expired token'
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required'
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};
