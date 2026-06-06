import { PrismaService } from '../prisma/prisma.service';
export declare class AppointmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    completeAppointment(appointmentId: string, usedParts: {
        partId: string;
        quantity: number;
    }[]): Promise<{
        id: string;
        clientId: string;
        technicianId: string | null;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        scheduledAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
