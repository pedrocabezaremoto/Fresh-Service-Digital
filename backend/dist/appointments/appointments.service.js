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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AppointmentsService = class AppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async completeAppointment(appointmentId, usedParts) {
        return this.prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.update({
                where: { id: appointmentId },
                data: { status: client_1.AppointmentStatus.COMPLETED },
            });
            for (const part of usedParts) {
                const sparePart = await tx.sparePart.findUnique({
                    where: { id: part.partId },
                });
                if (!sparePart) {
                    throw new common_1.BadRequestException(`El repuesto solicitado no existe: ID ${part.partId}`);
                }
                if (sparePart.stock < part.quantity) {
                    throw new common_1.BadRequestException(`Stock insuficiente para el repuesto: ${sparePart.name}. Disponible: ${sparePart.stock}`);
                }
                await tx.sparePart.update({
                    where: { id: part.partId },
                    data: { stock: { decrement: part.quantity } },
                });
                await tx.partAssignment.create({
                    data: {
                        appointmentId: appointmentId,
                        partId: part.partId,
                        quantity: part.quantity,
                    },
                });
            }
            return appointment;
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map