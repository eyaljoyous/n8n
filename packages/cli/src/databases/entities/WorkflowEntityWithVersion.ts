import { IConnections } from 'n8n-workflow';
import type { INode } from 'n8n-workflow';

import { Column, Entity, PrimaryColumn } from 'typeorm';
import { IsDate, IsOptional } from 'class-validator';

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

	@IsOptional() // ignored by validation because set at DB level
	@IsDate()
	createdAt: Date;

	@IsOptional() // ignored by validation because set at DB level
	@IsDate()
	updatedAt: Date;
}
