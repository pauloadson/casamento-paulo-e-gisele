"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GuestService = class GuestService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        if (!data.phone) {
            const guestWithoutPhone = await this.prisma.guest.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    isConfirmed: data.isConfirmed,
                    message: data.message,
                },
            });
            await this.prisma.auditLog.create({
                data: {
                    guestId: guestWithoutPhone.id,
                    action: 'CREATE_RSVP_NO_PHONE',
                    newStatus: data.isConfirmed,
                },
            });
            return guestWithoutPhone;
        }
        const existingGuest = await this.prisma.guest.findUnique({
            where: { phone: data.phone },
        });
        if (existingGuest) {
            const updatedGuest = await this.prisma.guest.update({
                where: { id: existingGuest.id },
                data: {
                    isConfirmed: data.isConfirmed,
                    name: data.name,
                    message: data.message,
                },
            });
            await this.prisma.auditLog.create({
                data: {
                    guestId: existingGuest.id,
                    action: 'REPEATED_RSVP_UPDATE',
                    oldStatus: existingGuest.isConfirmed,
                    newStatus: data.isConfirmed,
                },
            });
            return updatedGuest;
        }
        const newGuest = await this.prisma.guest.create({
            data: {
                name: data.name,
                phone: data.phone,
                isConfirmed: data.isConfirmed,
                message: data.message,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                guestId: newGuest.id,
                action: 'CREATE_RSVP',
                newStatus: data.isConfirmed,
            },
        });
        return newGuest;
    }
    async findAll() {
        return this.prisma.guest.findMany({
            include: {
                auditLogs: true,
            }
        });
    }
};
exports.GuestService = GuestService;
exports.GuestService = GuestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GuestService);
//# sourceMappingURL=guest.service.js.map