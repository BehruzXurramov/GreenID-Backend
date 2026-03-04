import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(500)
  beforeImage: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(500)
  afterImage: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  description: string;
}
