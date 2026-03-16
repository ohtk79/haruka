// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	// ビルド時に Vite define で注入されるグローバル定数
	const __BUILD_TIMESTAMP__: string;
	const __APP_VERSION__: string;

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// File System Access API (Chrome 86+)
	// TypeScript DOM lib に未定義のため、グローバル型拡張として宣言
	interface SaveFilePickerOptions {
		suggestedName?: string;
		types?: Array<{
			description?: string;
			accept?: Record<string, string[]>;
		}>;
	}

	interface Window {
		showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
	}
}

export {};
