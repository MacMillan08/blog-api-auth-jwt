import { PrismaClient, PostTag } from '@prisma/client';

const prisma = new PrismaClient();

export async function addTagToPost(postId: number, tagId: number): Promise<PostTag> {
    return prisma.postTag.create({
        data: {
            post_id: postId,
            tag_id: tagId,
        },
    });
}

export async function removeTagFromPost(postId: number, tagId: number): Promise<PostTag> {
    return prisma.postTag.delete({
        where: {
            post_id_tag_id: { 
                post_id: postId,
                tag_id: tagId,
            },
        },
    });
}

export async function getPostTags(postId: number): Promise<PostTag[]> {
    return prisma.postTag.findMany({
        where: { post_id: postId },
        include: { tag: true },
    });
}