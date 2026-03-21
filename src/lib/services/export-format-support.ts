// =============================================================================
// Export Format Support Service — Static capability and dynamic availability
// =============================================================================
// Depends on: models/types.ts, models/export-format.ts
// Tested by: tests/unit/export-format-support.test.ts
// Called from: stores/editor.svelte.ts, components/common/Header.svelte, routes/+page.svelte

import type { EditorState, KbdTargetOs, KeyAction, LayoutTemplate } from '$lib/models/types';
import {
	EXPORT_FORMAT_IDS,
	type AhkGeneratorResult,
	type ExportFormatId,
	type ExportFormatStatus
} from '$lib/models/export-format';
import { resolveKbdAction } from '$lib/models/kbd-target-registry';
import * as m from '$lib/paraglide/messages';

/** テンプレートの静的対応形式を解決する */
export function getSupportedFormats(template: LayoutTemplate): readonly ExportFormatId[] {
	let formats: ExportFormatId[];
	if (template.supportedFormats && template.supportedFormats.length > 0) {
		formats = [...template.supportedFormats];
	} else if (template.keOnly) {
		formats = ['json'];
	} else {
		formats = ['kbd', 'json'];
	}
	// json サポート時は json-unified を自動追加
	if (formats.includes('json') && !formats.includes('json-unified')) {
		const jsonIndex = formats.indexOf('json');
		formats.splice(jsonIndex + 1, 0, 'json-unified');
	}
	return formats;
}

/** 指定 format がテンプレートで静的対応しているか判定する */
export function isFormatStaticallySupported(
	template: LayoutTemplate,
	format: ExportFormatId
): boolean {
	return getSupportedFormats(template).includes(format);
}

interface ResolveExportFormatStatusesInput {
	template: LayoutTemplate;
	kbdText: string;
	keJsonText: string;
	keUnifiedJsonText: string;
	ahkResult: AhkGeneratorResult;
}

/** export / preview 用の format status を解決する */
export function resolveExportFormatStatuses({
	template,
	kbdText,
	keJsonText,
	keUnifiedJsonText,
	ahkResult
}: ResolveExportFormatStatusesInput): ExportFormatStatus[] {
	const supportedFormats = new Set(getSupportedFormats(template));

	return EXPORT_FORMAT_IDS.map((format) => {
		const staticallySupported = supportedFormats.has(format);
		const issues = format === 'ahk' ? ahkResult.issues : [];
		const notices = format === 'ahk' ? ahkResult.notices : [];
		const dynamicallyAvailable =
			format === 'kbd'
				? kbdText.length > 0
				: format === 'json'
					? keJsonText.length > 0
					: format === 'json-unified'
						? keUnifiedJsonText.length > 0
						: ahkResult.text.length > 0 && issues.length === 0;

		const available = staticallySupported && dynamicallyAvailable && issues.length === 0;

		let disabledReason: string | null = null;
		if (!staticallySupported) {
			disabledReason = getStaticDisabledReason(template, format);
		} else if (issues.length > 0) {
			disabledReason = issues[0].message;
		}

		return {
			format,
			available,
			staticallySupported,
			issues,
			notices,
			disabledReason
		};
	});
}

function getStaticDisabledReason(template: LayoutTemplate, format: ExportFormatId): string {
	if (format === 'kbd' && template.keOnly) {
		return m.header_appleKarabinerOnly();
	}
	return m.export_templateFormatUnsupported({ format: getFormatLabel(format) });
}

function getFormatLabel(format: ExportFormatId): string {
	switch (format) {
		case 'kbd':
			return m.header_exportKbd();
		case 'json':
			return m.header_exportJson();
		case 'json-unified':
			return m.header_exportJsonUnified();
		case 'ahk':
			return m.header_exportAhk();
	}
}

// =============================================================================
// KBD Validation — unsupported target 検出
// =============================================================================

export interface KbdUnsupportedDiagnostic {
	targetOs: KbdTargetOs;
	layerName: string;
	keyId: string;
	keyLabel: string;
	actionId: string;
	reason: string;
}

export interface KbdValidationResult {
	valid: boolean;
	unsupportedActions: KbdUnsupportedDiagnostic[];
}

/** 全レイヤー × 全アクションを走査し unsupported な action × target を検出する */
export function validateKbdExport(state: EditorState, target: KbdTargetOs): KbdValidationResult {
	const diagnostics: KbdUnsupportedDiagnostic[] = [];

	for (const layer of state.layers) {
		for (const [keyId, action] of layer.actions) {
			collectUnsupported(action, target, layer.name, keyId, diagnostics);
		}
	}

	return {
		valid: diagnostics.length === 0,
		unsupportedActions: diagnostics,
	};
}

function collectUnsupported(
	action: KeyAction,
	target: KbdTargetOs,
	layerName: string,
	keyId: string,
	diagnostics: KbdUnsupportedDiagnostic[]
): void {
	if (action.type === 'key') {
		const strategy = resolveKbdAction(action.value, target);
		if (strategy.type === 'unsupported') {
			diagnostics.push({
				targetOs: target,
				layerName,
				keyId,
				keyLabel: keyId,
				actionId: action.value,
				reason: strategy.reason,
			});
		}
	} else if (action.type === 'tap-hold') {
		collectUnsupported(action.tapAction, target, layerName, keyId, diagnostics);
		collectUnsupported(action.holdAction, target, layerName, keyId, diagnostics);
	}
}