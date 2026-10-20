import {copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const assetExtensions = new Set(['.mjs','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.avif','.ico','.woff2']);

async function collect(root, name, files) {
  const source = path.join(root, name);
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error(`Dowiązanie nie może trafić do publikacji: ${name}`);
  const basename = path.basename(name);
  if (info.isDirectory() && ['.idea', '.vscode', '__pycache__'].includes(basename)) return;
  if (info.isFile() && basename === '.DS_Store') return;
  if (path.basename(name).startsWith('.')) throw new Error(`Niedozwolony ukryty plik: ${name}`);
  if (info.isDirectory()) {
    for (const entry of (await readdir(source)).sort()) await collect(root, path.join(name, entry), files);
    return;
  }
  const allowed = name === 'index.html' || (name.startsWith(`assets${path.sep}`) && assetExtensions.has(path.extname(name))) || (name.startsWith(`data${path.sep}`) && path.extname(name) === '.json');
  if (!info.isFile() || !allowed) throw new Error(`Niedozwolony plik w zasobach publikacji: ${name}`);
  files.push(name);
}

export async function buildSite(root = projectRoot) {
  root = path.resolve(root);
  const files = [];
  for (const name of ['index.html', 'assets', 'data']) await collect(root, name, files);
  if (!files.includes(path.join('data','catalog.json'))) throw new Error('Brak data/catalog.json.');
  const publishedFiles = files.map(name => name.replace(/\.mjs$/, '.js'));
  if (new Set(publishedFiles).size !== publishedFiles.length) throw new Error('Kolizja nazw modułów .mjs i .js w paczce publikacyjnej.');
  const outDir = path.join(root, 'dist');
  const output = await lstat(outDir).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (output && (!output.isDirectory() || output.isSymbolicLink())) throw new Error('dist musi być zwykłym katalogiem, nie plikiem ani dowiązaniem.');
  const staging = await mkdtemp(path.join(root, '.kumilo-build-'));
  try {
    for (const name of files) {
      const destination = path.join(staging, name.replace(/\.mjs$/, '.js'));
      await mkdir(path.dirname(destination), {recursive:true});
      if (name === 'index.html' || name.endsWith('.mjs')) {
        const source = await readFile(path.join(root, name), 'utf8');
        await writeFile(destination, source.replace(/(\.\.?\/[^'"\s<>]+)\.mjs(?=['"])/g, '$1.js'));
      } else await copyFile(path.join(root, name), destination);
    }
    await writeFile(path.join(staging, '.nojekyll'), '');

    await rm(outDir, {recursive:true, force:true});
    await rename(staging, outDir);
  } finally { await rm(staging, {recursive:true, force:true}); }
  return {outDir, files:[...publishedFiles, '.nojekyll']};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const {outDir, files} = await buildSite();
    console.log(`Gotowe: ${outDir} (${files.length} plików). Publikuj wyłącznie zawartość tego katalogu.`);
  } catch (error) { console.error(`Nie udało się przygotować publikacji: ${error.message}`); process.exitCode = 1; }
}
