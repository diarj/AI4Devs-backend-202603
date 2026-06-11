import { getCandidatesByPosition } from '../application/services/positionService';

const createMockDb = () => ({
    position: {
        findUnique: jest.fn(),
    },
});

type MockDb = ReturnType<typeof createMockDb>;

describe('getCandidatesByPosition', () => {
    let mockDb: MockDb;

    beforeEach(() => {
        mockDb = createMockDb();
    });

    test('returns array with fullName, currentInterviewStep and averageScore for each candidate', async () => {
        mockDb.position.findUnique.mockResolvedValue({
            id: 1,
            title: 'Software Engineer',
            applications: [
                {
                    candidate: { id: 1, firstName: 'John', lastName: 'Doe' },
                    interviewStep: { name: 'Technical Interview' },
                    interviews: [{ score: 8 }, { score: 7 }],
                },
                {
                    candidate: { id: 2, firstName: 'Jane', lastName: 'Smith' },
                    interviewStep: { name: 'HR Interview' },
                    interviews: [{ score: 6 }, { score: 9 }, { score: 8 }],
                },
            ],
        });

        const result = await getCandidatesByPosition(1, mockDb as any);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            candidateId: 1,
            fullName: 'John Doe',
            currentInterviewStep: 'Technical Interview',
            averageScore: 7.5,
        });
        expect(result[1]).toEqual({
            candidateId: 2,
            fullName: 'Jane Smith',
            currentInterviewStep: 'HR Interview',
            averageScore: 7.666666666666667,
        });
    });

    test('returns empty array when position has no applications', async () => {
        mockDb.position.findUnique.mockResolvedValue({
            id: 2,
            title: 'Data Scientist',
            applications: [],
        });

        const result = await getCandidatesByPosition(2, mockDb as any);

        expect(result).toEqual([]);
    });

    test('throws error when position does not exist', async () => {
        mockDb.position.findUnique.mockResolvedValue(null);

        await expect(getCandidatesByPosition(999, mockDb as any)).rejects.toThrow(
            'Position not found'
        );
    });

    test('returns averageScore as null when candidate has no interviews', async () => {
        mockDb.position.findUnique.mockResolvedValue({
            id: 1,
            applications: [
                {
                    candidate: { id: 3, firstName: 'Alice', lastName: 'Brown' },
                    interviewStep: { name: 'Phone Screen' },
                    interviews: [],
                },
            ],
        });

        const result = await getCandidatesByPosition(1, mockDb as any);

        expect(result[0].averageScore).toBeNull();
    });

    test('returns averageScore as null when all interview scores are null', async () => {
        mockDb.position.findUnique.mockResolvedValue({
            id: 1,
            applications: [
                {
                    candidate: { id: 4, firstName: 'Bob', lastName: 'White' },
                    interviewStep: { name: 'Technical Interview' },
                    interviews: [{ score: null }, { score: null }],
                },
            ],
        });

        const result = await getCandidatesByPosition(1, mockDb as any);

        expect(result[0].averageScore).toBeNull();
    });

    test('averageScore only considers non-null scores', async () => {
        mockDb.position.findUnique.mockResolvedValue({
            id: 1,
            applications: [
                {
                    candidate: { id: 5, firstName: 'Carol', lastName: 'Green' },
                    interviewStep: { name: 'Technical Interview' },
                    interviews: [{ score: 8 }, { score: null }, { score: 6 }],
                },
            ],
        });

        const result = await getCandidatesByPosition(1, mockDb as any);

        expect(result[0].averageScore).toBe(7);
    });

    test('calls prisma with correct positionId and required includes', async () => {
        mockDb.position.findUnique.mockResolvedValue({ id: 1, applications: [] });

        await getCandidatesByPosition(1, mockDb as any);

        expect(mockDb.position.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 1 },
            })
        );
    });
});
