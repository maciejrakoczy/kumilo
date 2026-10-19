import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildSite} from '../scripts/build.mjs';

async function fixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'hermes-build-test-'));
  try {
    for (const directory of ['assets', 'data/klasa-4/historia/temat', 'materiały', 'local-server', 'tests']) await mkdir(path.join(root, directory), {recursive:true});
    const files = {'index.html':'<title>Kumilo</title>', 'assets/app.mjs':'export const ready = true;', 'assets/owl.svg':'<svg/>', 'data/catalog.json':'{}', 'data/klasa-4/historia/temat/topic.json':'{}', 'materiały/photo.jpg':'PRIVATE FIXTURE', 'local-server/serve.py':'LOCAL FIXTURE', 'tests/check.mjs':'TEST FIXTURE'};
    for (const [name, text] of Object.entries(files)) await writeFile(path.join(root, name), text);
    await run(root);
  } finally { await rm(root, {recursive:true, force:true}); }
}
async function filesIn(directory, prefix = '') {
  const names = [];
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) names.push(...await filesIn(path.join(directory, entry.name), name + '/'));
    else names.push(name);
  }
  return names.sort();
}
test('release copies only static app, data and Pages marker without changing bytes', () => fixture(async root => {
  const {outDir} = await buildSite(root);
  assert.deepEqual(await filesIn(outDir), ['.nojekyll','assets/app.mjs','assets/owl.svg','data/catalog.json','data/klasa-4/historia/temat/topic.json','index.html']);
  assert.equal(await readFile(path.join(outDir,'assets/app.mjs'),'utf8'), 'export const ready = true;');
}));
test('editor metadata inside data is neither read nor published', () => fixture(async root => {
  await mkdir(path.join(root,'data/klasa-4/historia/temat/.idea'));
  await writeFile(path.join(root,'data/klasa-4/historia/temat/.idea/workspace.xml'), 'EDITOR FIXTURE');
  await writeFile(path.join(root,'assets/.DS_Store'), 'EDITOR FIXTURE');
  const {outDir} = await buildSite(root);
  assert(!(await filesIn(outDir)).some(name => name.includes('.idea') || name.includes('.DS_Store')));
}));
test('rebuild removes stale generated files', () => fixture(async root => {
  const {outDir} = await buildSite(root);
  await writeFile(path.join(outDir,'stale.txt'), 'OLD');
  await buildSite(root);
  assert(!(await filesIn(outDir)).includes('stale.txt'));
}));
test('missing required source preserves previous build', () => fixture(async root => {
  const {outDir} = await buildSite(root);
  await rm(path.join(root,'data/catalog.json'));
  await assert.rejects(buildSite(root), /catalog/);
  assert.equal(await readFile(path.join(outDir,'index.html'),'utf8'), '<title>Kumilo</title>');
}));
test('symlinks cannot leak local files into publication', () => fixture(async root => {
  await symlink(path.join(root,'local-server/serve.py'),path.join(root,'assets/leak.mjs'));
  await assert.rejects(buildSite(root), /symlink|dowiązani/i);
}));
test('unexpected or hidden source files are not published silently', () => fixture(async root => {
  await writeFile(path.join(root,'assets/.env'), 'PRIVATE FIXTURE');
  await assert.rejects(buildSite(root), /niedozwol|niepublik|hidden/i);
}));
test('output symlink is rejected without modifying its target', () => fixture(async root => {
  await symlink(path.join(root,'local-server'),path.join(root,'dist'));
  await assert.rejects(buildSite(root), /dist|dowiązani/i);
  assert.equal(await readFile(path.join(root,'local-server/serve.py'),'utf8'), 'LOCAL FIXTURE');
}));
