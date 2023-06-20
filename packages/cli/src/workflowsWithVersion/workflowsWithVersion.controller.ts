/* eslint-disable no-param-reassign */

import express from 'express';
import { LoggerProxy } from 'n8n-workflow';

import * as Db from '@/Db';
import * as ResponseHelper from '@/ResponseHelper';
import { getLogger } from '@/Logger';
import type { WorkflowRequest } from '@/requests';
import { whereClause } from '@/UserManagement/UserManagementHelper';
import { WorkflowsWithVersionService } from '@/workflowsWithVersion/workflowsWithVersion.service';
import { WorkflowsService } from '@/workflows/workflows.services';

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
	ResponseHelper.send(async (req: WorkflowRequest.Get) => {
		const { id: workflowId } = req.params;

		const shared = await Db.collections.SharedWorkflow.findOne({
			where: whereClause({
				user: req.user,
				entityType: 'workflow',
				entityId: workflowId,
				roles: ['owner'],
			}),
		});

		if (!shared) {
			LoggerProxy.verbose('User attempted to access a workflow without permissions', {
				workflowId,
				userId: req.user.id,
			});
			throw new ResponseHelper.NotFoundError(
				'Could not load the workflow - you can only access workflows owned by you',
			);
		}

		return shared.workflow;
	}),
);
