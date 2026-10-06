<template>
	<div
		v-if="!disable || meta.exists || !metaReady"
		class="zen-report column relative-position"
		:class="{ 'zen-report--previewing': previewItem }"
	>
		<template v-if="!previewItem">
			<div class="col column flex-center q-pa-sm q-gutter-y-md">
				<div class="q-px-sm q-py-md rounded-borders text-center" style="font-size: 1.2em">
					<template v-if="meta.exists && meta.stale">{{ $t('general.reportStale') }}</template>
					<template v-else-if="meta.exists">{{ $t('general.reportExists', { date: generatedAtLabel }) }}</template>
					<template v-else-if="!disable">{{ $t('general.reportGenerateInfo') }}</template>
				</div>
				<div class="row q-gutter-sm flex-center">
					<q-btn
						v-if="meta.exists"
						:label="$t('general.reportView')"
						color="primary"
						icon="visibility"
						size="md"
						@click="onView"
					/>
					<q-btn
						v-else-if="!disable"
						:label="$t('general.reportGenerate')"
						color="primary"
						icon="print"
						size="md"
						@click="onGenerate"
					/>
					<q-btn
						v-if="meta.exists && !disable"
						:label="$t('general.reportRegenerate')"
						color="primary"
						outline
						icon="refresh"
						size="md"
						@click="onRegenerate"
					/>
				</div>
			</div>
		</template>
		<template v-else>
			<div class="row items-center q-px-sm col-auto">
				<q-space />
				<q-btn flat dense icon="crop_square" color="primary" @click="maximized = true">
					<q-tooltip>Maximize</q-tooltip>
				</q-btn>
				<q-btn flat dense icon="close" color="primary" @click="closePreview">
					<q-tooltip>Close</q-tooltip>
				</q-btn>
			</div>
			<div class="col zen-report__preview">
				<object v-show="!isLoading" :data="previewItem" class="zen-report__embed">
					<iframe :src="previewItem" class="zen-report__embed"></iframe>
				</object>
			</div>
			<q-dialog v-model="maximized" maximized transition-show="none" transition-hide="none">
				<q-card class="bg-primary text-white flex column" style="height: 100%;">
					<q-bar style="height: 35px;">
						<q-space />
						<q-btn flat icon="close" v-close-popup>
							<q-tooltip class="bg-white text-primary">Close</q-tooltip>
						</q-btn>
					</q-bar>
					<div class="col zen-report__preview">
						<object :data="previewItem" class="zen-report__embed">
							<iframe :src="previewItem" class="zen-report__embed"></iframe>
						</object>
					</div>
				</q-card>
			</q-dialog>
		</template>
		<q-inner-loading :showing="isLoading || !metaReady" color="primary" class="jina-loading-background">
			<q-spinner-gears size="100px" color="accent" />
		</q-inner-loading>
	</div>
	<div v-else class="zen-report zen-report--disabled col flex flex-center q-pa-sm">
		<div style="display: flex; flex-direction: column; align-items: center;">
			<q-icon name="warning" size="70px" color="primary" class="q-mb-md" />
			<span class="text-h6">{{ $t('general.noPermission') }}</span>
		</div>
	</div>
</template>
<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const props = defineProps({
	disable: { type: Boolean, required: true },
	rptName: { type: String, required: true },
	taskId: { type: [Number, String], required: true }
});
const { t, locale } = useI18n();
const $q = useQuasar();
const isLoading = ref(false);
const maximized = ref(false);
const previewItem = ref('');
const metaReady = ref(false);
const meta = ref({ exists: false, stale: false, generatedAt: null });

const generatedAtLabel = computed(() => formatGeneratedAt(meta.value.generatedAt));

function formatGeneratedAt(iso) {
	if (!iso)
		return '';
	const loc = locale.value.startsWith('fa') ? 'fa-IR-u-ca-persian' : locale.value;
	try {
		return new Date(iso).toLocaleString(loc, { dateStyle: 'short', timeStyle: 'short' });
	} catch {
		return String(iso);
	}
}

function clearPreview() {
	maximized.value = false;
	if (previewItem.value) {
		window.URL.revokeObjectURL(previewItem.value);
		previewItem.value = '';
	}
}

function closePreview() {
	clearPreview();
	loadMeta({ silent: true });
}

async function loadMeta({ silent = false } = {}) {
	if (!props.taskId || !props.rptName) {
		meta.value = { exists: false, stale: false, generatedAt: null };
		metaReady.value = true;
		return;
	}
	if (!silent)
		metaReady.value = false;
	const ret = await api.get(`/crtbl/report/${props.rptName}/${props.taskId}/meta`);
	if (ret?.data) {
		meta.value = {
			exists: !!ret.data.exists,
			stale: !!ret.data.stale,
			generatedAt: ret.data.generatedAt || null
		};
	} else if (!silent) {
		meta.value = { exists: false, stale: false, generatedAt: null };
	}
	metaReady.value = true;
}

async function fetchPdf(force) {
	isLoading.value = true;
	try {
		const ret = await api.get(`/crtbl/report/${props.rptName}/${props.taskId}`, {
			params: force ? { force: 1 } : {},
			responseType: 'blob'
		});
		if (!ret?.data || ret.data.type === 'application/json')
			return;
		const blob = ret.data instanceof Blob
			? ret.data
			: new Blob([ret.data], { type: 'application/pdf' });
		clearPreview();
		previewItem.value = window.URL.createObjectURL(blob);
		await loadMeta({ silent: true });
	} catch (err) {
		console.log('------------ error ------------', err);
	} finally {
		isLoading.value = false;
	}
}

function onView() {
	return fetchPdf(false);
}

function onGenerate() {
	return fetchPdf(false);
}

function onRegenerate() {
	$q.dialog({
		title: t('general.reportRegenerate'),
		message: t('general.reportRegenerateConfirm'),
		ok: { label: t('general.yes'), color: 'primary' },
		cancel: { label: t('general.no') },
		persistent: false
	}).onOk(() => fetchPdf(true));
}

watch(() => [props.rptName, props.taskId], () => loadMeta(), { immediate: true });
onBeforeUnmount(clearPreview);
</script>

<style scoped>
.zen-report {
	flex: 1 1 auto;
	min-height: 0;
	overflow: hidden;
}

.zen-report__preview {
	position: relative;
	min-height: 0;
	overflow: hidden;
}

.zen-report__embed {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border: none;
	display: block;
}
</style>

<style>
.q-scrollarea__content:has(.zen-report-fill-host) {
	height: 100%;
	width: 100%;
}

.zen-report-fill-host {
	box-sizing: border-box;
	width: 100%;
	max-width: 100%;
	height: 100%;
	max-height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.zen-report-fill-host>.zen-report {
	flex: 1 1 auto;
	min-height: 0;
}

.zen-report-fill-host:has(.zen-report--previewing)>.row {
	display: none;
}
</style>
