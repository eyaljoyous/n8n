<template>
	<Modal
		width="%80"
		maxHeight="100%"
		:center="true"
		:name="WORKFLOW_WITH_VERSION_MODAL_KEY"
		:title="$locale.baseText('viewWorkflowWithVersions.dialog.title')"
		:scrollable="true"
	>
		<template #content>
			<table :class="$style.table">
				<thead>
					<tr>
						<th v-for="key in relevantVersionKeys" :key="key">{{ key }}</th>
						<th>Compare</th>
						<th>Activate</th>
					</tr>
				</thead>
				<tbody>
					<!-- Iterate over the versions, no need to create a compare button and activate if it's the current version -->
					<tr v-for="(version, index) in versions" :key="version.id">
						<td v-for="key in relevantVersionKeys" :key="key">{{ version[key] }}</td>
						<td v-if="index !== 0">
							<font-awesome-icon
								icon="search"
								class="clickable"
								:title="$locale.baseText('fixedCollectionParameter.moveUp')"
								@click="compareWithVersion(index)"
							/>
						</td>
						<td v-else></td>
						<td v-if="index !== 0">
							<font-awesome-icon
								icon="exclamation-triangle"
								class="clickable"
								:title="$locale.baseText('fixedCollectionParameter.moveUp')"
								click=""
							/>
						</td>
						<td v-else></td>
					</tr>
				</tbody>
			</table>
			<section :class="$style.versions">
				<div>Diff:</div>
				<vue-json-compare
					v-if="versionIndexToCompare > 0"
					:oldData="versions[0]"
					:newData="versions[versionIndexToCompare]"
				></vue-json-compare>
			</section>
		</template>
	</Modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Modal from './Modal.vue';
import { WORKFLOW_WITH_VERSION_MODAL_KEY } from '../constants';
import { useWorkflowsStore } from '@/stores/workflows.store';
import type { IWorkflowDb } from '@/Interface';
import vueJsonCompare from 'vue-json-compare';

export default defineComponent({
	name: 'WorkflowWithVersionModalKey',
	components: {
		Modal,
		vueJsonCompare,
	},
	data() {
		return {
			relevantVersionKeys: ['versionId', 'updatedAt'],
			versions: [] as IWorkflowDb[],
			versionIndexToCompare: 0,
			WORKFLOW_WITH_VERSION_MODAL_KEY,
		};
	},
	async mounted() {
		this.getWorkflowWithVersions();
	},
	methods: {
		async getWorkflowWithVersions() {
			const workflowStore = useWorkflowsStore();
			const workflowId: String = workflowStore.workflowId;
			const workflows: IWorkflowDb[] = await workflowStore.fetchWorkflowWithVersion(workflowId);
			this.versions = [];
			for (const workflow of workflows.reverse()) {
				this.versions.push(workflow);
			}
		},
		compareWithVersion(versionIndex: Number) {
			this.versionIndexToCompare = versionIndex;
			console.log(versionIndex);
		},
	},
});
</script>

<style module lang="scss">
.scroll {
	overflow-y: auto;
	width: 100%;
	height: 100%;
}

.versions {
	background-color: $updates-panel-dark-background-color;
	border-top: $updates-panel-border;
	height: 100%;
	padding: 30px;
	overflow-y: scroll;
	padding-bottom: 220px;
}
.table {
	border-collapse: separate;
	text-align: left;
	width: calc(100%);
	font-size: var(--font-size-s);

	th {
		background-color: var(--color-background-base);
		border-top: var(--border-base);
		border-bottom: var(--border-base);
		border-left: var(--border-base);
		position: sticky;
		top: 0;
		color: var(--color-text-dark);
		z-index: 1;
	}

	td {
		vertical-align: top;
		padding: var(--spacing-2xs) var(--spacing-2xs) var(--spacing-2xs) var(--spacing-3xs);
		border-bottom: var(--border-base);
		border-left: var(--border-base);
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	td:first-child,
	td:nth-last-child(2) {
		position: relative;
		z-index: 0;

		&:after {
			// add border without shifting content
			content: '';
			position: absolute;
			height: 100%;
			width: 2px;
			top: 0;
		}
	}

	td:nth-last-child(2):after {
		right: -1px;
	}

	td:first-child:after {
		left: -1px;
	}

	th:last-child,
	td:last-child {
		border-right: var(--border-base);
	}
}
</style>
