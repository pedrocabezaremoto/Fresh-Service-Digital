import { AppointmentsService } from './appointments.service';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    complete(id: string, parts: {
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
