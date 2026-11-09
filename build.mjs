#!/usr/bin/env node
/**
 * 零依赖构建：把 src/*.js 按文件名顺序拼进 DSH 的 Client ModuleLoader 工厂。
 *
 * 源文件是无 import/export 的普通脚本片段（共享同一个函数作用域），
 * 顺序即依赖顺序；新增文件请用数字前缀控制位置。
 *
 * 用法：npm run build
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, 'src');
const outFile = join(root, 'client.js');
const PACKAGE_ID = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).name;

const files = (await readdir(srcDir)).filter((f) => f.endsWith('.js')).sort();
if (files.length === 0) {
  console.error('build: src/ 下没有 .js 文件');
  process.exit(1);
}

const parts = [];
for (const f of files) {
  parts.push(await readFile(join(srcDir, f), 'utf8'));
}

const head = `/**
 * 由 build.mjs 生成，不要直接编辑。源码在 src/ 下，改完跑 npm run build。
 */
window.__ModuleLoader__.load({
  id: '${PACKAGE_ID}',
  factory(require) {
`;
const tail = `  },
});
`;

await writeFile(outFile, head + parts.join('\n') + tail, 'utf8');
console.log(`build: ${files.length} 个源文件 → client.js（${(head + parts.join('\n') + tail).length} 字节）`);
