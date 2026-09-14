import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCatalog } from '../src/lib/catalog.mjs';
const mixes = getCatalog().filter(e=>e.group==='mixes');
let index=0;
async function check() {
  while(index<mixes.length) {
    const mix=mixes[index++];
    const response=await fetch(mix.audio,{method:'HEAD',signal:AbortSignal.timeout(20000)});
    const size=statSync(resolve('../../media/listening',mix.file)).size;
    if(!response.ok || !response.headers.get('content-type')?.includes('audio/mpeg') || Number(response.headers.get('content-length'))!==size)
      throw new Error(`Audio verification failed: ${mix.id} (${response.status})`);
  }
}
await Promise.all(Array.from({length:4},check));
const sample=await fetch(mixes[0].audio,{headers:{Range:'bytes=0-1023'}});
if(sample.status!==206 || (await sample.arrayBuffer()).byteLength!==1024) throw new Error('Audio range/seek verification failed');
console.log(`Verified all ${mixes.length} audio URLs, byte sizes, MIME types, and a byte-range request.`);
