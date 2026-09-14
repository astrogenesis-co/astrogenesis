import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getCatalog } from '../src/lib/catalog.mjs';

if (process.env.EXPLORE_PREVIEW === '1') throw new Error('Uploads must use the public catalog.');
const run = promisify(execFile);
const config = JSON.parse(readFileSync('audio.storage.json','utf8'));
const source = resolve('../../media/listening');
const mixes = getCatalog().filter(e=>e.group==='mixes');
if(mixes.some(e=>!e.mixDate || !/\d{4}-\d{2}-\d{2}/.test(e.id))) throw new Error('Only dated mixes may be uploaded.');
const files = [...new Set(mixes.map(e=>e.file))];
const receiptPath = resolve(source,'r2-uploaded.json');
const receipts = existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath,'utf8')) : {};
let next = 0, done = 0;
async function worker() {
  while(next < files.length) {
    const file = files[next++];
    const path = resolve(source,file);
    const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
    const key = `${config.bucket}/mixes/${file}`;
    if(receipts[key] !== hash) {
      await run(process.execPath, ['node_modules/wrangler/bin/wrangler.js','r2','object','put',key,'--file',path,'--remote','--content-type','audio/mpeg','--content-disposition',`attachment; filename="${file}"`,'--cache-control','public, max-age=31536000, immutable'],{maxBuffer:1024*1024});
      receipts[key] = hash;
      writeFileSync(receiptPath,JSON.stringify(receipts,null,2)+'\n');
    }
    done++;
    console.log(`Audio ready ${done}/${files.length}: ${file}`);
  }
}
await Promise.all(Array.from({length:4},worker));
