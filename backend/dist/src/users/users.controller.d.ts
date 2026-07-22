import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    createUser(body: any): Promise<{
        id: number;
        username: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getInfo(): Promise<{
        success: boolean;
    }>;
}
