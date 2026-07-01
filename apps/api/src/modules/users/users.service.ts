import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/jwt-payload.interface';
import { UpdateProfileDto, UpdateUserRoleDto } from './dto/users.dto';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, requester: AuthenticatedUser) {
    this.ensureAccess(id, requester);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  me(requester: AuthenticatedUser) {
    return this.findOne(requester.id, requester);
  }

  async updateProfile(id: string, dto: UpdateProfileDto, requester: AuthenticatedUser) {
    this.ensureAccess(id, requester);

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: userSelect,
    });
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: userSelect,
    });
  }

  private ensureAccess(targetId: string, requester: AuthenticatedUser) {
    const isAdmin = requester.role === UserRole.ADMIN;
    const isSelf = requester.id === targetId;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Cannot access this user');
    }
  }
}
