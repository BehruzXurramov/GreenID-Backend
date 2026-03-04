import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const sslMode = configService.get<string>('DB_SSL') ?? 'disable';
  const channelBindingMode =
    configService.get<string>('DB_CHANNEL_BINDING') ?? 'disable';

  return {
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST'),
    port: configService.getOrThrow<number>('DB_PORT'),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: configService.getOrThrow<boolean>('DB_SYNC'),
    logging: false,
    ssl:
      sslMode === 'disable'
        ? false
        : {
            rejectUnauthorized:
              sslMode === 'verify-ca' || sslMode === 'verify-full',
          },
    extra: {
      sslmode: sslMode,
      channel_binding: channelBindingMode,
      enableChannelBinding: channelBindingMode !== 'disable',
    },
  };
};
