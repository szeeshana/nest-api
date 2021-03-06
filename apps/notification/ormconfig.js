/* tslint:disable:quotemark object-literal-sort-keys */
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from './src/snake-naming.strategy';

if (!module.hot /* for webpack HMR */) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
}

dotenv.config({
  path: `.${process.env.NODE_ENV}.env`,
});

// Replace \\n with \n to support multiline strings in AWS
for (const envName of Object.keys(process.env)) {
  process.env[envName] = process.env[envName].replace(/\\n/g, '\n');
}

module.exports = {
  type: 'postgres',
  host: process.env.NOTIFICATIONS_POSTGRES_HOST,
  port: +process.env.NOTIFICATIONS_POSTGRES_PORT,
  username: process.env.NOTIFICATIONS_POSTGRES_USERNAME,
  password: process.env.NOTIFICATIONS_POSTGRES_PASSWORD,
  database: process.env.NOTIFICATIONS_POSTGRES_DATABASE,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [__dirname + '/src/modules/**/*.entity{.ts,.js}'],
  //   entities: [
  //     'src/modules/tag/tag.entity.ts',
  //     'src/modules/tag/user.tag.entity.ts',
  //   ],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: __dirname + '/src/migrations',
  },
};
