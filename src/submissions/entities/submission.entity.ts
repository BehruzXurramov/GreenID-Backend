import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubmissionStatus } from '../enums/submission-status.enum';

@Entity('submissions')
@Index('IDX_SUBMISSION_USER_ID', ['userId'])
@Index('IDX_SUBMISSION_STATUS', ['status'])
@Index('IDX_SUBMISSION_CREATED_AT', ['createdAt'])
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 500 })
  beforeImage: string;

  @Column({ type: 'varchar', length: 500 })
  afterImage: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  adminDescription: string | null;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ type: 'int', nullable: true })
  pointsGiven: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
