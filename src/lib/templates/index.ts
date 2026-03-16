// =============================================================================
// Template Registry
// =============================================================================
// Central registry for all keyboard layout templates

import { ANSI_104_TEMPLATE } from './ansi104';
import { APPLE_MAGIC_JIS_TEMPLATE } from './apple-magic-jis';
import { APPLE_MAGIC_US_TEMPLATE } from './apple-magic-us';
import { JIS_109_TEMPLATE } from './jis109';
import type { LayoutTemplate } from '$lib/models/types';
import * as m from '$lib/paraglide/messages';

/** All available templates (display order) */
export const TEMPLATES: readonly LayoutTemplate[] = [
	ANSI_104_TEMPLATE,
	JIS_109_TEMPLATE,
	APPLE_MAGIC_US_TEMPLATE,
	APPLE_MAGIC_JIS_TEMPLATE
] as const;

/** Default template for first launch */
export const DEFAULT_TEMPLATE: LayoutTemplate = ANSI_104_TEMPLATE;

/** Look up a template by its ID */
export function getTemplateById(id: string): LayoutTemplate | undefined {
	return TEMPLATES.find((t) => t.id === id);
}

/** テンプレート名の表示ラベル（ロケール対応） */
export function getTemplateName(templateId: string): string {
	const names: Record<string, () => string> = {
		'ansi-104': m.template_ansi104,
		'jis-109': m.template_jis109,
		'apple-us': m.template_appleUs,
		'apple-jis': m.template_appleJis,
	};
	return names[templateId]?.() ?? templateId;
}

/** Union of kanataNames across all templates (for KeyPicker filtering) */
export const ALL_TEMPLATE_KANATA_NAMES: ReadonlySet<string> = new Set(
	TEMPLATES.flatMap((t) => t.keys.map((k) => k.kanataName).filter((name): name is string => name !== undefined))
);

// Re-export for convenience
export { JIS_109_TEMPLATE } from './jis109';
export { ANSI_104_TEMPLATE } from './ansi104';
export { APPLE_MAGIC_JIS_TEMPLATE } from './apple-magic-jis';
export { APPLE_MAGIC_US_TEMPLATE } from './apple-magic-us';
