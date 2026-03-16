// =============================================================================
// Base64URL — RFC 4648 §5 準拠のエンコード / デコード
// =============================================================================
// Depends on: (none)
// Tested by: tests/unit/base64url.test.ts
// Called from: services/share-url.ts

/**
 * Uint8Array を Base64URL 文字列にエンコードする
 * パディング ('=') は除去する
 */
export function base64urlEncode(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL 文字列を Uint8Array にデコードする
 * パディングは自動補完する
 */
export function base64urlDecode(encoded: string): Uint8Array {
	const padding = (4 - (encoded.length % 4)) % 4;
	const base64 = (encoded + '='.repeat(padding)).replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
