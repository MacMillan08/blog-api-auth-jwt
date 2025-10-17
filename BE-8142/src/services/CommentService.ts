import { PrismaClient, Comment, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface CommentFilters {
    postId?: number;
    username?: string;
}

export async function findAll(filters: CommentFilters = {}): Promise<Comment[]> {
    const whereCondition: Prisma.CommentWhereInput = {};

    if (filters.postId) {
        whereCondition.post_id = filters.postId;
    }

    if (filters.username) {
        whereCondition.user = {
            username: {
                contains: filters.username,
                mode: 'insensitive',
            }
        };
    }

    return prisma.comment.findMany({
        where: whereCondition,
        orderBy: {
            created_at: 'desc',
        },
    });
}

export async function findById(id: number): Promise<Comment | null> {
    return prisma.comment.findUnique({
        where: { id },
    });
}