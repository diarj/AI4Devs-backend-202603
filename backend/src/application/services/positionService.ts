import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CandidateInProcess {
    candidateId: number;
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
}

export const getCandidatesByPosition = async (
    positionId: number,
    client: Pick<PrismaClient, 'position'> = prisma
): Promise<CandidateInProcess[]> => {
    const position = await client.position.findUnique({
        where: { id: positionId },
        include: {
            applications: {
                include: {
                    candidate: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    interviewStep: {
                        select: { name: true },
                    },
                    interviews: {
                        select: { score: true },
                    },
                },
            },
        },
    });

    if (!position) {
        throw new Error('Position not found');
    }

    return position.applications.map((app) => {
        const nonNullScores = app.interviews
            .map((i) => i.score)
            .filter((s): s is number => s !== null);

        const averageScore =
            nonNullScores.length > 0
                ? nonNullScores.reduce((sum, s) => sum + s, 0) / nonNullScores.length
                : null;

        return {
            candidateId: app.candidate.id,
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep?.name ?? '',
            averageScore,
        };
    });
};
