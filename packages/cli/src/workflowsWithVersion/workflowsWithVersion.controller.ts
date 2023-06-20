/* eslint-disable no-param-reassign */

import express from 'express';
import { LoggerProxy } from 'n8n-workflow';

import * as Db from '@/Db';
import * as ResponseHelper from '@/ResponseHelper';
import { getLogger } from '@/Logger';
import type { WorkflowRequest, WorkflowWithVersionRequest } from '@/requests';
import { whereClause } from '@/UserManagement/UserManagementHelper';
import { WorkflowsWithVersionService } from '@/workflowsWithVersion/workflowsWithVersion.service';

export const workflowsWithVersionController = express.Router();

/**
 * Initialize Logger if needed
 */
workflowsWithVersionController.use((req, res, next) => {
	try {
		LoggerProxy.getInstance();
	} catch (error) {
		LoggerProxy.init(getLogger());
	}
	next();
});

/**
 * GET /workflows-with-version
 */
workflowsWithVersionController.get(
	'/',
	ResponseHelper.send(async () => {
		return WorkflowsWithVersionService.getAll();
	}),
);

/**
 * GET /workflows-with-version/:id
 */
workflowsWithVersionController.get(
	'/:id(\\d+)',
	ResponseHelper.send(async (req: WorkflowWithVersionRequest.Get) => {
		const { id } = req.params;
		return WorkflowsWithVersionService.getAllForWorkflow(id);
	}),
);
