import { PrismaService } from '../prisma/prisma.service';
export declare class GuestService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        uuid: string;
        name: string;
        phone: string | null;
        isConfirmed: boolean;
        message: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    findAll(): Promise<({
        auditLogs: {
            createdAt: Date;
            id: number;
            action: string;
            oldStatus: boolean | null;
            newStatus: boolean | null;
            guestId: number;
        }[];
    } & {
        uuid: string;
        name: string;
        phone: string | null;
        isConfirmed: boolean;
        message: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    })[]>;
}
