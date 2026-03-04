import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionAdminDto } from './dto/update-submission-admin.dto';
import { SubmissionsService } from './submissions.service';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    return this.submissionsService.create(user.userId, createSubmissionDto);
  }

  @Get('my')
  findMySubmissions(@CurrentUser() user: RequestUser) {
    return this.submissionsService.findMySubmissions(user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.submissionsService.findAll();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  reviewSubmission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSubmissionAdminDto: UpdateSubmissionAdminDto,
  ) {
    return this.submissionsService.reviewSubmission(
      id,
      updateSubmissionAdminDto,
    );
  }
}
