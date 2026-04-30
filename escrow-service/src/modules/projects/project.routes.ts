import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const projectController = new ProjectController();

// Apply JWT authentication middleware to all project routes
router.use(authenticateToken);

// POST /projects - Create a new project (freelancer only)
router.post('/', projectController.createProject);

// GET /projects - Get all projects for the logged-in user (freelancer or employer)
router.get('/', projectController.getProjects);

// GET /projects/:id/milestones - Get all milestones for a project
router.get('/:id/milestones', projectController.getProjectMilestones);

// GET /projects/:id - Get a specific project by ID (freelancer or employer owned)
router.get('/:id', projectController.getProjectById);

export const projectRouter = router;
