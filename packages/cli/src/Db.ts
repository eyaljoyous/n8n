import { Container } from 'typedi';
// eslint-disable-next-line n8n-local-rules/misplaced-n8n-typeorm-import
import type { EntityManager } from '@n8n/typeorm';
// eslint-disable-next-line n8n-local-rules/misplaced-n8n-typeorm-import
import { DataSource as Connection } from '@n8n/typeorm';
import { ErrorReporterProxy as ErrorReporter } from 'n8n-workflow';

import { inTest } from '@/constants';
import { wrapMigration } from '@db/utils/migrationHelpers';
import type { Migration } from '@db/types';
import { getConnectionOptions } from '@db/config';
import config from '@/config';

let connection: Connection;

export const getConnection = () => connection!;

type ConnectionState = {
	connected: boolean;
	migrated: boolean;
};

export const connectionState: ConnectionState = {
	connected: false,
	migrated: false,
};

// Ping DB connection every 2 seconds
let pingTimer: NodeJS.Timer | undefined;
if (!inTest) {
	const pingDBFn = async () => {
		if (connection?.isInitialized) {
			try {
				// await connection.query('SELECT 1');
				await connection.query('SELECT * from pg_tables LIMIT 1');
				connectionState.connected = true;
				return;
			} catch (error) {
				ErrorReporter.error(error);
			} finally {
				pingTimer = setTimeout(pingDBFn, 2000);
			}
		}
		connectionState.connected = false;
	};
	pingTimer = setTimeout(pingDBFn, 2000);
}

export async function setSchema(conn: Connection) {
	const schema = config.getEnv('database.postgresdb.schema');
	console.log('setSchema', schema);
	const searchPath = ['public'];
	if (schema !== 'public') {
		await conn.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
		searchPath.unshift(schema);
		console.log('searchPath', searchPath);
	}
	await conn.query(`SET search_path TO ${searchPath.join(',')};`);
}

export async function transaction<T>(fn: (entityManager: EntityManager) => Promise<T>): Promise<T> {
	return await connection.transaction(fn);
}

export async function init(): Promise<void> {
	if (connectionState.connected) return;
	const dbType = config.getEnv('database.type');
	console.log('init dbType', dbType);

	const connectionOptions = getConnectionOptions();
	console.log('init connectionOptions', connectionOptions);
	connection = new Connection(connectionOptions);
	console.log('init connection', connection);
	Container.set(Connection, connection);
	await connection.initialize();

	if (dbType === 'postgresdb') {
		await setSchema(connection);
	}

	connectionState.connected = true;
}

export async function migrate() {
	(connection.options.migrations as Migration[]).forEach(wrapMigration);
	await connection.runMigrations({ transaction: 'each' });
	connectionState.migrated = true;
}

export const close = async () => {
	if (pingTimer) {
		clearTimeout(pingTimer);
		pingTimer = undefined;
	}

	if (connection.isInitialized) await connection.destroy();
};
