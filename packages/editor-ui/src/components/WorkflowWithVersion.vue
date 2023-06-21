<template>
	<Modal
		width="460px"
		:center="true"
		:name="WORKFLOW_WITH_VERSION_MODAL_KEY"
		:title="$locale.baseText('viewWorkflowWithVersions.dialog.title')"
	>
		<template #content>
			<div v-for="(item, index) in versions" :key="index">
				<p>{{ item.versionId }}</p>
			</div>
		</template>
	</Modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Modal from './Modal.vue';
import { WORKFLOW_WITH_VERSION_MODAL_KEY } from '../constants';
import { useWorkflowsStore } from '@/stores/workflows.store';
import { IWorkflowDb } from '@/Interface';

export default defineComponent({
	name: 'WorkflowWithVersionModalKey',
	components: {
		Modal,
	},
	data() {
		return {
			versions: [] as IWorkflowDb[],
			WORKFLOW_WITH_VERSION_MODAL_KEY,
		};
	},
	async mounted() {
		this.getWorkflowWithVersions();
	},
	methods: {
		async getWorkflowWithVersions() {
			const workflows: IWorkflowDb[] = await useWorkflowsStore().fetchWorkflowWithVersion('5');
			this.versions = [];
			for (const workflow of workflows) {
				this.versions.push(workflow);
			}
		},
	},
});
</script>

<style module lang="scss"></style>
