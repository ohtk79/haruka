// =============================================================================
// Compression — CompressionStream API ラッパー (deflate-raw)
// =============================================================================
// Depends on: (none)
// Tested by: tests/unit/compression.test.ts
// Called from: services/share-url.ts

/**
 * CompressionStream API が利用可能かどうかを判定する
 */
export function isCompressionStreamAvailable(): boolean {
	return (
		typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
	);
}

/**
 * ReadableStream の全チャンクを結合して Uint8Array に変換する
 */
async function readAllChunks(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<Uint8Array> {
	const chunks: Uint8Array[] = [];
	let result: ReadableStreamReadResult<Uint8Array>;
	while (!(result = await reader.read()).done) {
		chunks.push(result.value);
	}
	if (chunks.length === 1) return chunks[0];
	const total = chunks.reduce((s, c) => s + c.length, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.length;
	}
	return out;
}

/**
 * Uint8Array を deflate-raw で圧縮する
 */
export async function compress(data: Uint8Array): Promise<Uint8Array> {
	const stream = new CompressionStream('deflate-raw');
	const writer = stream.writable.getWriter();
	writer.write(data.slice());
	writer.close();
	return readAllChunks(stream.readable.getReader());
}

/**
 * deflate-raw で圧縮された Uint8Array を展開する
 */
export async function decompress(data: Uint8Array): Promise<Uint8Array> {
	const stream = new DecompressionStream('deflate-raw');
	const writer = stream.writable.getWriter();
	writer.write(data.slice());
	writer.close();
	return readAllChunks(stream.readable.getReader());
}
