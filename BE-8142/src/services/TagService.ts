import { PrismaClient, Tag, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function findAll(): Promise<Tag[]> {
    return prisma.tag.findMany({
        orderBy: { created_at: 'desc' },
    });
}

export async function findById(id: number): Promise<Tag | null> {
    return prisma.tag.findUnique({
        where: { id },
    });
}

export async function create(name: string): Promise<Tag> {
    return prisma.tag.create({
        data: { name },
    });
}

export async function update(id: number, name: string): Promise<Tag> {
    return prisma.tag.update({
        where: { id },
        data: { name },
    });
}

export async function remove(id: number): Promise<Tag> {
    return prisma.tag.delete({
        where: { id },
    });
}