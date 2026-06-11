import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/positionService';

export const getCandidatesByPositionController = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const candidates = await getCandidatesByPosition(id);
        res.status(200).json(candidates);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Position not found') {
                return res.status(404).json({ error: error.message });
            }
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
