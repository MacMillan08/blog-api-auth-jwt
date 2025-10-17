import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt'; 


const prisma = new PrismaClient();
const saltRounds = 10; 

type SafeUser = Omit<User, 'hashed_password'>;

export async function createUser(data: { name: string, username: string, password: string, role?: UserRole }): Promise<User> {
    
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    
    return prisma.user.create({
        data: {
            name: data.name,
            username: data.username,
            hashed_password: hashedPassword,
            role: data.role || UserRole.member,
        },
    });
}

export async function getUsers(): Promise<SafeUser[]> {
    return prisma.user.findMany({
        where: { deleted_at: null },
        select: { id: true, name: true, username: true, role: true, created_at: true, deleted_at: true },
    });
}

export async function getUserById(id: number): Promise<SafeUser | null> {
    return prisma.user.findUnique({
        where: { id, deleted_at: null },
        select: { id: true, name: true, username: true, role: true, created_at: true, deleted_at: true },
    });
}

export async function updateUser(id: number, data: { name?: string, username?: string, password?: string, role?: UserRole }): Promise<User> {
    const updateData: any = { name: data.name, username: data.username, role: data.role };

    if (data.password) {
        updateData.hashed_password = await bcrypt.hash(data.password, saltRounds); // <-- DEĞİŞİKLİK
    }
    
    return prisma.user.update({
        where: { id, deleted_at: null },
        data: updateData,
    });
}

export async function deleteUser(id: number): Promise<User> {
    return prisma.user.update({
        where: { id, deleted_at: null },
        data: { deleted_at: new Date() },
    });
}

export async function getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
        where: { username, deleted_at: null },
    });
}