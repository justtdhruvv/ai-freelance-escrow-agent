import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const projectController = new ProjectController();

// Apply JWT authentication middleware to all project routes
router.use(authenticateToken);

// POST /projects - Create a new project (employer only)
router.post('/', projectController.createProject);

// GET /projects - Get all projects for the logged-in employer
router.get('/', projectController.getProjects);

// GET /projects/:id - Get a specific project by ID (employer owned)
router.get('/:id', projectController.getProjectById);

export const projectRouter = router;
