import { Router } from 'express';
import { getCandidatesByPositionController } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidatesByPositionController);

export default router;
