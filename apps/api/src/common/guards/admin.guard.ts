import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ADMIN_ONLY_KEY = 'adminOnly';
export const AdminOnly = () => (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(ADMIN_ONLY_KEY, true, descriptor?.value ?? target);
    return descriptor ?? target;
};

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isAdminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isAdminOnly) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        if (user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
