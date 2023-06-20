import type { WorkflowEntityWithVersion } from '@/databases/entities/WorkflowEntityWithVersion';
import { collections } from '@/Db';

export class WorkflowsWithVersionService {
	static async getAll(): Promise<WorkflowEntityWithVersion[]> {
		return collections.WorkflowWithVersion.find();
	}
}
