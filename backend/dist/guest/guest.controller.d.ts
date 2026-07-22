import { GuestService } from './guest.service';
export declare class GuestController {
    private readonly guestService;
    constructor(guestService: GuestService);
    create(body: any): Promise<{
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
