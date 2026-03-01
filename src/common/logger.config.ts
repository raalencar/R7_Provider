import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

export const winstonConfig: winston.LoggerOptions = {
  level: isDev ? 'debug' : 'info',
  transports: [
    new winston.transports.Console({
      format: isDev
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('R7Provider', {
              colors: true,
              prettyPrint: true,
            }),
          )
        : winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
    }),
  ],
};
