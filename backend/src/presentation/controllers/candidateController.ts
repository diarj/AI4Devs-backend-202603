import { Request, Response } from 'express';
import {
    addCandidate,
    findCandidateById,
    updateApplicationStage,
} from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateCandidateStage = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id);
        if (isNaN(candidateId) || candidateId <= 0) {
            return res.status(400).json({ error: 'Invalid candidate ID format' });
        }

        const { applicationId, newInterviewStep } = req.body;

        if (!applicationId || !Number.isInteger(applicationId) || applicationId <= 0) {
            return res
                .status(400)
                .json({ error: 'applicationId is required and must be a positive integer' });
        }

        if (!newInterviewStep || !Number.isInteger(newInterviewStep) || newInterviewStep <= 0) {
            return res
                .status(400)
                .json({ error: 'newInterviewStep is required and must be a positive integer' });
        }

        const data = await updateApplicationStage(candidateId, { applicationId, newInterviewStep });
        res.status(200).json({ message: 'Stage updated successfully', data });
    } catch (error) {
        if (error instanceof Error) {
            const notFoundMessages = [
                'Candidate not found',
                'Application not found for this candidate',
            ];
            if (notFoundMessages.includes(error.message)) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === "Invalid interview step for this position's flow") {
                return res.status(400).json({ error: error.message });
            }
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };