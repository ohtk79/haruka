// =============================================================================
// DialogState — ダイアログ表示状態の集約管理
// =============================================================================
// Depends on: models/share-types.ts, models/types.ts
// Tested by: tests/e2e/ (export, url-share, template-selection)
// Called from: routes/+page.svelte

import type { ImportSummary } from '$lib/models/share-types';
import type { LayoutTemplate } from '$lib/models/types';

/**
 * 全ダイアログの表示状態を $state で管理するクラス。
 * +page.svelte のダイアログ関連ロジックをここに集約する。
 */
export class DialogState {
	// --- 確認ダイアログ ---
	confirmOpen = $state(false);
	confirmTitle = $state('');
	confirmDesc = $state('');
	confirmLabel = $state('OK');
	confirmAction = $state<(() => void) | null>(null);

	// --- 新規ファイル確認ダイアログ ---
	newFileConfirmOpen = $state(false);
	newFileTemplate = $state<LayoutTemplate | null>(null);

	// --- インポート確認ダイアログ ---
	importConfirmOpen = $state(false);
	importSummary = $state<ImportSummary>({
		templateName: '',
		layerCount: 0,
		changedKeyCount: 0,
		changedSettingsCount: 0
	});

	// --- 共有 URL エラー表示 ---
	shareErrorMessage = $state<string | null>(null);

	/** 確認ダイアログを開く */
	openConfirmDialog(title: string, desc: string, label: string, action: () => void): void {
		this.confirmTitle = title;
		this.confirmDesc = desc;
		this.confirmLabel = label;
		this.confirmAction = action;
		this.confirmOpen = true;
	}

	/** 確認ダイアログを閉じる */
	closeConfirmDialog(): void {
		this.confirmOpen = false;
	}

	/** 新規ファイルダイアログを開く */
	openNewFileDialog(template: LayoutTemplate): void {
		this.newFileTemplate = template;
		this.newFileConfirmOpen = true;
	}

	/** 新規ファイルダイアログを閉じる */
	closeNewFileDialog(): void {
		this.newFileConfirmOpen = false;
		this.newFileTemplate = null;
	}

	/** インポート確認ダイアログを開く */
	openImportDialog(summary: ImportSummary): void {
		this.importSummary = summary;
		this.importConfirmOpen = true;
	}

	/** インポート確認ダイアログを閉じる */
	closeImportDialog(): void {
		this.importConfirmOpen = false;
	}

	/** 共有 URL エラーメッセージを設定する */
	setShareError(message: string | null): void {
		this.shareErrorMessage = message;
	}
}
