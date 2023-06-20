import { IConnections } from 'n8n-workflow';
import type { INode } from 'n8n-workflow';

import { Column, Entity, Generated, PrimaryColumn } from 'typeorm';

import { jsonColumnType } from './AbstractEntity';

@Entity()
export class WorkflowEntityWithVersion {
	@Column()
	id: string;

	@Column({ length: 128 })
	name: string;

	@Column()
	active: boolean;

	@Column(jsonColumnType)
	nodes: INode[];

	@Column(jsonColumnType)
	connections: IConnections;

	@PrimaryColumn({})
	versionId: string;
}
