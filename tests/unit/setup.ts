// vitest 用セットアップ: jsdom の navigator.language を 'ja' に固定
// Paraglide の preferredLanguage strategy が日本語を選択するようにする
Object.defineProperty(navigator, 'language', {
	value: 'ja',
	configurable: true
});
Object.defineProperty(navigator, 'languages', {
	value: ['ja', 'ja-JP'],
	configurable: true
});
