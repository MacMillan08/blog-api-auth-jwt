import { PrismaClient, Post, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface PostFilters {
    onlyDeleted?: boolean;
    showDeleted?: boolean;
    category?: number;
    status?: 'published' | 'draft';
    tags?: number[];
}

interface PostData {
    title: string;
    content: string;
    category_id: number;
}

export async function findAll(filters: PostFilters = {}): Promise<Post[]> {
    const whereConditions: Prisma.PostWhereInput[] = [];

    whereConditions.push({ deleted_at: null });

    if (filters.onlyDeleted) {
        whereConditions.pop();
        whereConditions.push({ deleted_at: { not: null } });
    } else if (filters.showDeleted) {
        whereConditions.pop();
    }

    if (filters.category) {
        whereConditions.push({ category_id: filters.category });
    }

    if (filters.status === 'published') {
        whereConditions.push({ published_at: { not: null } });
    } else if (filters.status === 'draft') {
        whereConditions.push({ published_at: null });
    }

    if (filters.tags && filters.tags.length > 0) {
        whereConditions.push({
            postTags: {
                some: {
                    tag_id: {
                        in: filters.tags
                    }
                }
            }
        });
    }

    const finalWhere: Prisma.PostWhereInput = { AND: whereConditions };

    return prisma.post.findMany({
        where: finalWhere,
        orderBy: {
            created_at: 'desc',
        },
    });
}

export async function findById(id: number): Promise<Post | null> {
    return prisma.post.findUnique({
        where: { id },
    });
}

export async function create(userId: number, data: PostData): Promise<Post> {
    const createData = {
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        user: { connect: { id: userId } },
    };

    return prisma.post.create({
        data: createData as any,
    });
}

export async function update(id: number, data: Prisma.PostUpdateInput): Promise<Post> {
    return prisma.post.update({
        where: { id, deleted_at: null },
        data,
    });
}

export async function remove(id: number): Promise<Post> {
    return prisma.post.update({
        where: { id, deleted_at: null },
        data: { deleted_at: new Date() },
    });
}