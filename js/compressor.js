class Compressor{
	
	static async _test(str){
		return str === await this.decode(await this.encode(str));
	}

	static async encode(string){
		return this.bufToB64( await this.compress(string));
	}
	static async decode(encodedB64){
		return new TextDecoder().decode(await this.decompress(this.b64ToBuf(encodedB64)));
	}
	
	static async compress(string){
		const encoder = new TextEncoder();
		const inputReadableStream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode(string)); 
				controller.close(); 
			}
		});

		const compressedReadableStream = inputReadableStream.pipeThrough(new CompressionStream("deflate-raw"));
		const reader = compressedReadableStream.getReader();
		let chunks = [];
		let result;
		while (!(result = await reader.read()).done) {
			chunks.push(result.value); 
		}
		const merged = this.mergeUint8Arrays(...chunks);
	
		return merged;
	}
		
	static mergeUint8Arrays(...arrays) {
		const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
		const mergedArray = new Uint8Array(totalLength);
		let offset = 0;
		arrays.forEach(array => {
			mergedArray.set(array, offset);
			offset += array.length; 
		});
		return mergedArray;
	}
		
	static async decompress(buf){
		
		const inputReadableStream = new ReadableStream({
			start(controller) {
				controller.enqueue(buf); 
				controller.close(); 
			}
		});
		
		const deCompressedReadableStream = inputReadableStream.pipeThrough(new DecompressionStream("deflate-raw"));
		const reader = deCompressedReadableStream.getReader();
		let chunks = [];
		let result;
		while (!(result = await reader.read()).done) {
			chunks.push(result.value); 
		}
		const merged = this.mergeUint8Arrays(...chunks);
		return merged;	
	}	
		
	static encodeForUrl(b64Str) {
	  return b64Str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}	
			
	static decodeFromUrl(b64Url){
	  const base64Encoded = b64Url.replace(/-/g, '+').replace(/_/g, '/');
	  const padding = b64Url.length % 4 === 0 ? '' : '='.repeat(4 - (b64Url.length % 4));
	  const base64WithPadding = base64Encoded + padding;
	  return atob(base64WithPadding)
		.split('')
		.map(char => String.fromCharCode(char.charCodeAt(0)))
		.join('');
	}	
		
		
	static bufToB64(buf){
		
		return this.encodeForUrl(btoa(String.fromCharCode(...buf)));
	}
		
	static b64ToBuf(base64){
		
			
		const binaryString = this.decodeFromUrl(base64);
		const length = binaryString.length;
		const uint8Array = new Uint8Array(length);
		for (let i = 0; i < length; i++) {
			uint8Array[i] = binaryString.charCodeAt(i);
		}
		return uint8Array;
	}
}

export { Compressor };
