import { GuestService } from './guest.service';
export declare class GuestController {
    private readonly guestService;
    constructor(guestService: GuestService);
    create(body: any): Promise<{
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
