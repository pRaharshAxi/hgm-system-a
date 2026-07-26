import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../auth/auth.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { RolesGuard } from '../auth/roles.guard';
  import { UserRole } from './user.entity';
  import { AdminUserQueryDto } from './dto/admin-user-query.dto';
  import { UsersService } from './users.service';
  
  @ApiTags('Admin - Users')
  @ApiBearerAuth()
  @Controller('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  export class AdminUsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Get()
    async findAll(@Query() query: AdminUserQueryDto) {
      return this.usersService.findAllAdmin(query);
    }
  
    @Patch(':id/toggle')
    async toggleUserActive(@Param('id', ParseUUIDPipe) id: string) {
      return this.usersService.toggleActive(id);
    }
  }