import { updateApplicationStage } from '../application/services/candidateService';

const createMockDb = () => ({
    candidate: {
        findUnique: jest.fn(),
    },
    application: {
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    interviewStep: {
        findFirst: jest.fn(),
    },
});

type MockDb = ReturnType<typeof createMockDb>;

const mockCandidate = { id: 1, firstName: 'John', lastName: 'Doe' };
const mockApplication = {
    id: 3,
    candidateId: 1,
    positionId: 1,
    currentInterviewStep: 4,
    position: { interviewFlowId: 10 },
};
const mockStep = { id: 5, name: 'Technical Interview', interviewFlowId: 10 };

describe('updateApplicationStage', () => {
    let mockDb: MockDb;

    beforeEach(() => {
        mockDb = createMockDb();
    });

    test('updates currentInterviewStep successfully and returns updated data', async () => {
        mockDb.candidate.findUnique.mockResolvedValue(mockCandidate);
        mockDb.application.findFirst.mockResolvedValue(mockApplication);
        mockDb.interviewStep.findFirst.mockResolvedValue(mockStep);
        mockDb.application.update.mockResolvedValue({
            id: 3,
            candidateId: 1,
            currentInterviewStep: 5,
        });

        const result = await updateApplicationStage(
            1,
            { applicationId: 3, newInterviewStep: 5 },
            mockDb as any
        );

        expect(result).toEqual({
            applicationId: 3,
            candidateId: 1,
            currentInterviewStep: 5,
        });
    });

    test('calls application.update with correct arguments', async () => {
        mockDb.candidate.findUnique.mockResolvedValue(mockCandidate);
        mockDb.application.findFirst.mockResolvedValue(mockApplication);
        mockDb.interviewStep.findFirst.mockResolvedValue(mockStep);
        mockDb.application.update.mockResolvedValue({
            id: 3,
            candidateId: 1,
            currentInterviewStep: 5,
        });

        await updateApplicationStage(
            1,
            { applicationId: 3, newInterviewStep: 5 },
            mockDb as any
        );

        expect(mockDb.application.update).toHaveBeenCalledWith({
            where: { id: 3 },
            data: { currentInterviewStep: 5 },
        });
    });

    test('throws "Candidate not found" when candidate does not exist', async () => {
        mockDb.candidate.findUnique.mockResolvedValue(null);

        await expect(
            updateApplicationStage(999, { applicationId: 3, newInterviewStep: 5 }, mockDb as any)
        ).rejects.toThrow('Candidate not found');

        expect(mockDb.application.findFirst).not.toHaveBeenCalled();
    });

    test('throws "Application not found for this candidate" when application does not belong to candidate', async () => {
        mockDb.candidate.findUnique.mockResolvedValue(mockCandidate);
        mockDb.application.findFirst.mockResolvedValue(null);

        await expect(
            updateApplicationStage(1, { applicationId: 99, newInterviewStep: 5 }, mockDb as any)
        ).rejects.toThrow('Application not found for this candidate');

        expect(mockDb.interviewStep.findFirst).not.toHaveBeenCalled();
    });

    test("throws \"Invalid interview step for this position's flow\" when step does not belong to the flow", async () => {
        mockDb.candidate.findUnique.mockResolvedValue(mockCandidate);
        mockDb.application.findFirst.mockResolvedValue(mockApplication);
        mockDb.interviewStep.findFirst.mockResolvedValue(null);

        await expect(
            updateApplicationStage(1, { applicationId: 3, newInterviewStep: 99 }, mockDb as any)
        ).rejects.toThrow("Invalid interview step for this position's flow");

        expect(mockDb.application.update).not.toHaveBeenCalled();
    });

    test('verifies application ownership using both applicationId and candidateId', async () => {
        mockDb.candidate.findUnique.mockResolvedValue(mockCandidate);
        mockDb.application.findFirst.mockResolvedValue(mockApplication);
        mockDb.interviewStep.findFirst.mockResolvedValue(mockStep);
        mockDb.application.update.mockResolvedValue({
            id: 3,
            candidateId: 1,
            currentInterviewStep: 5,
        });

        await updateApplicationStage(
            1,
            { applicationId: 3, newInterviewStep: 5 },
            mockDb as any
        );

        expect(mockDb.application.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ id: 3, candidateId: 1 }),
            })
        );
    });

    test('validates interviewStep against the interviewFlowId of the position', async () => {
        mockDb.candidate.findUnique.mockResolvedValue(mockCandidate);
        mockDb.application.findFirst.mockResolvedValue(mockApplication);
        mockDb.interviewStep.findFirst.mockResolvedValue(mockStep);
        mockDb.application.update.mockResolvedValue({
            id: 3,
            candidateId: 1,
            currentInterviewStep: 5,
        });

        await updateApplicationStage(
            1,
            { applicationId: 3, newInterviewStep: 5 },
            mockDb as any
        );

        expect(mockDb.interviewStep.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 5,
                    interviewFlowId: mockApplication.position.interviewFlowId,
                }),
            })
        );
    });

    test('is idempotent: updating to the same step succeeds', async () => {
        const applicationAtStep5 = { ...mockApplication, currentInterviewStep: 5 };
        mockDb.candidate.findUnique.mockResolvedValue(mockCandidate);
        mockDb.application.findFirst.mockResolvedValue(applicationAtStep5);
        mockDb.interviewStep.findFirst.mockResolvedValue(mockStep);
        mockDb.application.update.mockResolvedValue({
            id: 3,
            candidateId: 1,
            currentInterviewStep: 5,
        });

        const result = await updateApplicationStage(
            1,
            { applicationId: 3, newInterviewStep: 5 },
            mockDb as any
        );

        expect(result.currentInterviewStep).toBe(5);
    });
});
