import path from 'path';
import { Container } from 'typedi';
import type { TlsOptions } from 'tls';
import type { DataSourceOptions, LoggerOptions } from '@n8n/typeorm';
import type { SqliteConnectionOptions } from '@n8n/typeorm/driver/sqlite/SqliteConnectionOptions';
import type { SqlitePooledConnectionOptions } from '@n8n/typeorm/driver/sqlite-pooled/SqlitePooledConnectionOptions';
import type { PostgresConnectionOptions } from '@n8n/typeorm/driver/postgres/PostgresConnectionOptions';
import type { MysqlConnectionOptions } from '@n8n/typeorm/driver/mysql/MysqlConnectionOptions';
import { InstanceSettings } from 'n8n-core';
import { ApplicationError } from 'n8n-workflow';
import { GlobalConfig } from '@n8n/config';

import config from '@/config';
import { entities } from './entities';
import { subscribers } from './subscribers';
import { mysqlMigrations } from './migrations/mysqldb';
import { postgresMigrations } from './migrations/postgresdb';
import { sqliteMigrations } from './migrations/sqlite';
import { parsePostgresUrl } from '@/ParserHelper';

// const getCommonOptions = () => {
// 	const { tablePrefix: entityPrefix, logging: loggingConfig } =
// 		Container.get(GlobalConfig).database;

// 	let loggingOption: LoggerOptions = loggingConfig.enabled;
// 	if (loggingOption) {
// 		const optionsString = loggingConfig.options.replace(/\s+/g, '');
// 		if (optionsString === 'all') {
// 			loggingOption = optionsString;
// 		} else {
// 			loggingOption = optionsString.split(',') as LoggerOptions;
// 		}
// 	}

// 	return {
// 		entityPrefix,
// 		entities: Object.values(entities),
// 		subscribers: Object.values(subscribers),
// 		migrationsTableName: `${entityPrefix}migrations`,
// 		migrationsRun: false,
// 		synchronize: false,
// 		maxQueryExecutionTime: loggingConfig.maxQueryExecutionTime,
// 		logging: loggingOption,
// 	};
// };

const getCommonOptions = () => {
	const entityPrefix = config.getEnv('database.tablePrefix');
	const maxQueryExecutionTime = config.getEnv('database.logging.maxQueryExecutionTime');

	let loggingOption: LoggerOptions = config.getEnv('database.logging.enabled');
	if (loggingOption) {
		const optionsString = config.getEnv('database.logging.options').replace(/\s+/g, '');

		if (optionsString === 'all') {
			loggingOption = optionsString;
		} else {
			loggingOption = optionsString.split(',') as LoggerOptions;
		}
	}
	return {
		entityPrefix,
		entities: Object.values(entities),
		subscribers: Object.values(subscribers),
		migrationsTableName: `${entityPrefix}migrations`,
		migrationsRun: false,
		synchronize: false,
		maxQueryExecutionTime,
		logging: loggingOption,
	};
};

// export const getOptionOverrides = (dbType: 'postgresdb' | 'mysqldb') => {
// 	const globalConfig = Container.get(GlobalConfig);
// 	const dbConfig = globalConfig.database[dbType];
// 	return {
// 		database: dbConfig.database,
// 		host: dbConfig.host,
// 		port: dbConfig.port,
// 		username: dbConfig.user,
// 		password: dbConfig.password,
// 	};
// };

export const getOptionOverrides = (dbType: 'postgresdb' | 'mysqldb') => {
  const globalConfig = Container.get(GlobalConfig);
  const dbConfig = globalConfig.database[dbType];

  console.log('here!!!!!!!!!!!!!!!!!!!!!!!!!!')
  console.log('dbConfig', dbConfig)


	let connectionDetails;
	if (dbType == 'postgresdb') {
    console.log('HERE AGAIN!!!!!!!!!')
    console.log('using parsePostGresURL()')
    console.log(parsePostgresUrl());

		connectionDetails = parsePostgresUrl();
	}
	if (!connectionDetails) {
    console.log('not using postgresURL!!!!!!')
		connectionDetails = {

			database: config.getEnv(`database.${dbType}.database`),
			host: config.getEnv(`database.${dbType}.host`),
			port: config.getEnv(`database.${dbType}.port`),
			username: config.getEnv(`database.${dbType}.user`),
			password: config.getEnv(`database.${dbType}.password`),

		}
	}
	return connectionDetails;
}

const getSqliteConnectionOptions = (): SqliteConnectionOptions | SqlitePooledConnectionOptions => {
	const globalConfig = Container.get(GlobalConfig);
	const sqliteConfig = globalConfig.database.sqlite;
	const commonOptions = {
		...getCommonOptions(),
		database: path.resolve(Container.get(InstanceSettings).n8nFolder, sqliteConfig.database),
		migrations: sqliteMigrations,
	};
	if (sqliteConfig.poolSize > 0) {
		return {
			type: 'sqlite-pooled',
			poolSize: sqliteConfig.poolSize,
			enableWAL: true,
			acquireTimeout: 60_000,
			destroyTimeout: 5_000,
			...commonOptions,
		};
	} else {
		return {
			type: 'sqlite',
			enableWAL: sqliteConfig.enableWAL,
			...commonOptions,
		};
	}
};

const getPostgresConnectionOptions = (): PostgresConnectionOptions => {
	// const postgresConfig = Container.get(GlobalConfig).database.postgresdb;
	// const {
	// 	ssl: { ca: sslCa, cert: sslCert, key: sslKey, rejectUnauthorized: sslRejectUnauthorized },
	// } = postgresConfig;

  const sslCa = config.getEnv('database.postgresdb.ssl.ca');
	const sslCert = config.getEnv('database.postgresdb.ssl.cert');
	const sslKey = config.getEnv('database.postgresdb.ssl.key');
	const sslRejectUnauthorized = config.getEnv('database.postgresdb.ssl.rejectUnauthorized');


  let ssl: TlsOptions | boolean = config.getEnv('database.postgresdb.ssl.enabled');

  if (!isPostgresRunningLocally()) {
    if (sslCa !== '' || sslCert !== '' || sslKey !== '' || !sslRejectUnauthorized) {
      ssl = {
        ca: sslCa || undefined,
        cert: sslCert || undefined,
        key: sslKey || undefined,
        rejectUnauthorized: sslRejectUnauthorized,
      };
    }
  }

  console.log('FINAL DB CONFIG!!!!!!!!!!!!!!!!!!')

  console.log({
		type: 'postgres',
		...getCommonOptions(),
		...getOptionOverrides('postgresdb'),
		schema: config.getEnv('database.postgresdb.schema'),
		poolSize: config.getEnv('database.postgresdb.poolSize'),
		migrations: postgresMigrations,
		ssl,
	})

	return {
		type: 'postgres',
		...getCommonOptions(),
		...getOptionOverrides('postgresdb'),
		schema: config.getEnv('database.postgresdb.schema'),
		poolSize: config.getEnv('database.postgresdb.poolSize'),
		migrations: postgresMigrations,
		ssl,
	};
};

const getMysqlConnectionOptions = (dbType: 'mariadb' | 'mysqldb'): MysqlConnectionOptions => ({
	type: dbType === 'mysqldb' ? 'mysql' : 'mariadb',
	...getCommonOptions(),
	...getOptionOverrides('mysqldb'),
	migrations: mysqlMigrations,
	timezone: 'Z', // set UTC as default
});

export function getConnectionOptions(): DataSourceOptions {
	// const globalConfig = Container.get(GlobalConfig);
  const dbType = config.getEnv('database.type');
	// const { type: dbType } = globalConfig.database;
	switch (dbType) {
		case 'sqlite':
			return getSqliteConnectionOptions();
		case 'postgresdb':
			return getPostgresConnectionOptions();
		case 'mariadb':
		case 'mysqldb':
			return getMysqlConnectionOptions(dbType);
		default:
			throw new ApplicationError('Database type currently not supported', { extra: { dbType } });
	}
}

function isPostgresRunningLocally(): Boolean {
	let host: String | undefined;
	const postgresConfig = parsePostgresUrl();
	if (postgresConfig != null) {
		host = postgresConfig.host;
	} else {
		host = config.getEnv('database.postgresdb.host');
	}
	return host === ('localhost' || '127.0.0.1');
}
