import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(username: string): Promise<{
        id: number;
        username: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create(username: string, passwordPlain: string): Promise<{
        id: number;
        username: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    count(): Promise<number>;
    updatePassword(username: string, passwordPlain: string): Promise<{
        id: number;
        username: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
