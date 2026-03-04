import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { UpdateSubmissionAdminDto } from './dto/update-submission-admin.dto';
import { Submission } from './entities/submission.entity';
import { SubmissionStatus } from './enums/submission-status.enum';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionsRepository: Repository<Submission>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    const submission = this.submissionsRepository.create({
      userId,
      beforeImage: createSubmissionDto.beforeImage,
      afterImage: createSubmissionDto.afterImage,
      description: createSubmissionDto.description,
      status: SubmissionStatus.PENDING,
      adminDescription: null,
      pointsGiven: null,
    });

    const savedSubmission = await this.submissionsRepository.save(submission);
    return this.toResponseDto(savedSubmission);
  }

  async findMySubmissions(userId: string): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return submissions.map((submission) => this.toResponseDto(submission));
  }

  async findAll(): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionsRepository.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return submissions.map((submission) =>
      this.toResponseDto(submission, true),
    );
  }

  async reviewSubmission(
    submissionId: string,
    updateDto: UpdateSubmissionAdminDto,
  ): Promise<SubmissionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const submissionRepository = manager.getRepository(Submission);
      const userRepository = manager.getRepository(User);

      const submission = await submissionRepository.findOne({
        where: { id: submissionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!submission) {
        throw new NotFoundException('Submission not found');
      }

      const user = await userRepository.findOne({
        where: { id: submission.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const previousPoints = submission.pointsGiven ?? 0;
      const nextPoints = updateDto.pointsGiven;

      if (submission.status === SubmissionStatus.APPROVED) {
        user.points = user.points - previousPoints + nextPoints;
      } else {
        user.points += nextPoints;
      }

      submission.status = SubmissionStatus.APPROVED;
      submission.pointsGiven = nextPoints;

      if (updateDto.adminDescription !== undefined) {
        submission.adminDescription = updateDto.adminDescription;
      }

      await userRepository.save(user);
      const updatedSubmission = await submissionRepository.save(submission);

      updatedSubmission.user = user;
      return this.toResponseDto(updatedSubmission, true);
    });
  }

  private toResponseDto(
    submission: Submission,
    includeUser = false,
  ): SubmissionResponseDto {
    return {
      id: submission.id,
      userId: submission.userId,
      beforeImage: submission.beforeImage,
      afterImage: submission.afterImage,
      description: submission.description,
      adminDescription: submission.adminDescription,
      status: submission.status,
      pointsGiven: submission.pointsGiven,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      user:
        includeUser && submission.user
          ? this.usersService.toSummaryDto(submission.user)
          : undefined,
    };
  }
}
