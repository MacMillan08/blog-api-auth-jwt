import { PrismaClient, Category, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function findAll(): Promise<Category[]> {
    return prisma.category.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
    });
}

export async function findById(id: number): Promise<Category | null> {
    return prisma.category.findUnique({
        where: { id, deleted_at: null },
    });
}

export async function create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({
        data,
    });
}

export async function update(id: number, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({
        where: { id, deleted_at: null },
        data,
    });
}

export async function remove(id: number): Promise<Category> {
    return prisma.category.update({
        where: { id, deleted_at: null },
        data: { deleted_at: new Date() },
    });
}