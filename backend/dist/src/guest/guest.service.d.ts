import { PrismaService } from '../prisma/prisma.service';
export declare class GuestService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        uuid: string;
        phone: string | null;
        isConfirmed: boolean;
        message: string | null;
    }>;
    findAll(): Promise<({
        auditLogs: {
            id: number;
            createdAt: Date;
            action: string;
            oldStatus: boolean | null;
            newStatus: boolean | null;
            guestId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        uuid: string;
        phone: string | null;
        isConfirmed: boolean;
        message: string | null;
    })[]>;
}
