/* Critical continuity tests. Uses a temporary Chrome profile and synthetic edits. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const moduleFlag = process.argv.indexOf('--playwright');
const { chromium } = require(moduleFlag < 0 ? 'playwright' : process.argv[moduleFlag + 1]);
const root = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'offshore-qa-'));
const results = [];
const errors = [];

async function check(name, action) {
  await action();
  results.push({ name, result: 'passed' });
  console.log('PASS ' + name);
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.OFFSHORE_BROWSER_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const requests = [];
  await context.route(/^https?:/, route => { requests.push(route.request().url()); return route.abort(); });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await check('Original recebido permanece inalterado', async () => {
      const expected = fs.readFileSync(path.join(__dirname, 'original.sha256'), 'utf8').split(' ')[0];
      const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'offshore_workshop_interativo_v17.html'))).digest('hex');
      assert.equal(actual, expected);
    });
    await check('Abertura local mantém a base e identifica a versão 18', async () => {
      assert.match(await page.title(), /v18/);
      const inventory = await page.evaluate(() => ({ version: state.formatVersion, boards: state.boards.length, features: MATRIX.items.length, cases: state.boards.reduce((n, b) => n + b.cases.length, 0), archivedCases: state.v13ArchivedDefaults.removedCases.length }));
      assert.deepEqual(inventory, { version: '18.0', boards: 8, features: 85, cases: 11, archivedCases: 15 });
    });
    await check('Desktop, celular e acesso ao conteúdo por teclado', async () => {
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'workspace-main');
      await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: false });
      const mobile = await context.newPage();
      mobile.on('pageerror', error => errors.push(error.message));
      await mobile.setViewportSize({ width: 390, height: 844 });
      await mobile.goto(pathToFileURL(path.join(root, 'index.html')).href);
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await mobile.screenshot({ path: path.join(output, 'mobile.png'), fullPage: false });
      await mobile.close();
    });
    await check('Navegação pelas áreas e frentes não gera erro de execução', async () => {
      await page.evaluate(() => {
        for (const next of ['overview', 'tracker', 'launch', 'catalog', 'registry', 'macro', 'archive', 'settings']) { view.page = next; render(); }
        for (const board of state.boards) { view.page = 'board'; view.boardId = board.id; for (const step of [-1, 0, 1, 4, 5]) { view.step = step; render(); } }
        view.page = 'overview'; render();
      });
      assert.deepEqual(errors, []);
    });
    await check('Casos criados nos editores continuam ativos após recarregar', async () => {
      for (const id of ['onboarding', 'banking', 'wealth']) {
        await page.locator(`aside [data-action="bp-open-front"][data-id="${id}"]`).first().click();
        await page.locator('[data-action="bp-new-case"]').first().click();
        await page.locator('#bp-form [name="title"]').fill('Teste de continuidade ' + id);
        await page.locator('#bp-form [name="profiles"]').first().check();
        await page.locator('#bp-form button[type="submit"]').click();
        assert.equal(await page.locator('#bp-dialog').count(), 0);
      }
      await page.reload();
      const counts = await page.evaluate(() => ['onboarding', 'banking', 'wealth'].map(id => boardBy(id).cases.filter(c => c.title === 'Teste de continuidade ' + id && c.steps.length > 0).length));
      assert.deepEqual(counts, [1, 1, 1]);
    });
    await check('Oferta de Onboarding permanece ativa na recarga', async () => {
      await page.evaluate(() => { view.boardId = 'onboarding'; editForm('offers'); });
      await page.locator('#modal-form [name="title"]').fill('Oferta criada no workshop');
      await page.locator('#modal-form button[type="submit"]').click();
      await page.reload();
      assert.equal(await page.evaluate(() => boardBy('onboarding').offers.some(o => o.title === 'Oferta criada no workshop')), true);
    });
    await check('Editor salva objetivo e dados com fornecedor, sem alterar o caso padrão', async () => {
      await page.evaluate(() => {
        state.systems.push({ id: 'test-system', name: 'Sistema de teste', status: 'Ativo' });
        const b = boardBy('onboarding'), c = b.cases.find(x => x.title === 'Teste de continuidade onboarding');
        bpEditStage(b.id, c.uid, c.steps[0].uid);
      });
      await page.locator('#bp-form [name="name"]').fill('Etapa com dados de teste');
      await page.locator('#bp-form [name="objective"]').selectOption('Consultar');
      await page.locator('#bp-editor-data > summary').click();
      await page.locator('[data-action="v17-add-data"]').click();
      await page.locator('[data-v17-data-name]').fill('Identificador de teste');
      await page.locator('[data-v17-data-kind]').selectOption('systems');
      await page.locator('[data-v17-data-provider]').selectOption('test-system');
      await page.locator('#bp-form button[type="submit"]').click();
      await page.reload();
      const data = await page.evaluate(() => {
        const b = boardBy('onboarding'), s = b.cases.find(c => c.title === 'Teste de continuidade onboarding').steps[0];
        return { objective: s.objective, provider: s.dataRequirements[0].providerId, originalName: bpDefault(b).steps[0].name, dataUid: s.dataRequirements[0].uid };
      });
      assert.equal(data.objective, 'Consultar'); assert.equal(data.provider, 'test-system'); assert.equal(data.originalName, 'KYC'); assert.ok(data.dataUid);
    });
    await check('Normalização atual é idempotente e preserva cópias independentes', async () => {
      assert.equal(await page.evaluate(() => {
        const a = normalizeState(state), b = normalizeState(a);
        const c = boardBy('onboarding').cases.find(x => x.title === 'Teste de continuidade onboarding'), copy = bpCopySteps(c);
        return JSON.stringify(a) === JSON.stringify(b) && copy[0].uid !== c.steps[0].uid && copy[0].dataRequirements[0].uid !== c.steps[0].dataRequirements[0].uid;
      }), true);
    });
    await check('JSON inválido, IDs duplicados e cancelamento preservam a sessão', async () => {
      const outcome = await page.evaluate(() => {
        const before = JSON.stringify(state), bad = [];
        bad.push(null, { schema: 999, boards: [] });
        const duplicate = clone(state); duplicate.boards.push(clone(duplicate.boards[0])); bad.push(duplicate);
        const malformed = clone(state); malformed.boards[0].cases = 'inválido'; bad.push(malformed);
        const defaults = clone(state); defaults.boards[0].cases.push({ ...defaults.boards[0].cases[0], uid: 'duplicate-default' }); bad.push(defaults);
        const nullEntry = clone(state); nullEntry.systems.push(null); bad.push(nullEntry);
        let rejected = 0;
        for (const input of bad) { try { applyOpenedJSON(input, 'invalid.json', null, false); } catch (error) { if (/Formato de dados/.test(error.message)) rejected++; } }
        const confirmOriginal = window.confirm; window.confirm = () => false; jsonDirty = true;
        const cancelled = applyOpenedJSON(clone(state), 'cancelled.json', null, true) === false;
        window.confirm = confirmOriginal;
        return { rejected, total: bad.length, cancelled, intact: before === JSON.stringify(state), nullNormalization: normalizeState(null) };
      });
      assert.equal(outcome.rejected, outcome.total); assert.equal(outcome.cancelled, true); assert.equal(outcome.intact, true); assert.equal(outcome.nullNormalization, null);
    });
    await check('Migrações dos schemas 1 a 3 preservam o original completo', async () => {
      assert.equal(await page.evaluate(() => [1, 2, 3].every(schema => {
        const legacy = { schema, session: { title: 'Sessão anterior' }, boards: [{ id: 'onboarding', name: 'Onboarding anterior', cases: [{ uid: 'legacy-case', title: 'Caso anterior', profiles: ['Private Offshore'], flow: 'Entrada → Revisão' }], offers: [{ uid: 'legacy-offer', title: 'Oferta anterior' }] }] };
        const migrated = normalizeState(legacy);
        return JSON.stringify(migrated.migrationArchive) === JSON.stringify(legacy) && migrated.boards.find(b => b.id === 'onboarding').cases.some(c => c.uid === 'legacy-case');
      })), true);
    });
    await check('Cobertura explica e calcula oito verificações por etapa', async () => {
      const result = await page.evaluate(() => {
        const b = clone(boardBy('onboarding')), c = bpDefault(b); c.steps = [bpBlankStep('Teste')];
        const empty = bpCoverage(b), s = c.steps[0];
        Object.assign(s, { actorIds: ['test'], channelIds: ['test'], operationLinks: [{ areaId: 'test', role: 'Revisar' }], systemIds: ['test-system'], capabilityNotes: 'Validar cadastro', support: 'Atendimento assistido', objective: 'Consultar', dataNotApplicable: true });
        const full = bpCoverage(b); s.dataNotApplicable = false; s.dataRequirements = [{ name: 'Identificador', providerKind: 'systems', providerId: 'missing' }];
        return { empty, full, missing: bpCoverage(b), copy: tracker().includes('oito verificações') };
      });
      assert.equal(result.empty.total, 8); assert.equal(result.empty.done, 0); assert.equal(result.full.ratio, 100); assert.equal(result.missing.done, 7); assert.equal(result.copy, true);
    });
    await check('Exportação JSON e importação mantêm todos os dados da sessão', async () => {
      const before = await page.evaluate(() => JSON.stringify(state));
      const downloaded = page.waitForEvent('download');
      await page.locator('.toptools details > summary').click();
      await page.locator('[data-action="export-json"]').click();
      const download = await downloaded;
      const file = path.join(output, 'session.json'); await download.saveAs(file);
      assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8'))), before);
      await page.locator('#import-file').setInputFiles(file);
      await page.waitForFunction(() => jsonHasExport && !jsonDirty);
      assert.equal(await page.evaluate(() => JSON.stringify(state)), before);
    });
    await check('HTML preenchido reabre offline com caracteres especiais e sessão independente', async () => {
      const text = 'Sessão com acentos e emoji 🧭 </script><script>window.__injected=true</script>';
      await page.evaluate(value => { state.session.title = value; save(); }, text);
      const expected = await page.evaluate(() => JSON.stringify(state));
      const downloaded = page.waitForEvent('download');
      await page.evaluate(() => exportHTML());
      const download = await downloaded;
      assert.match(download.suggestedFilename(), /v18/);
      const file = path.join(output, 'portable.html'); await download.saveAs(file);
      const portable = await context.newPage(); portable.on('pageerror', error => errors.push(error.message));
      await portable.goto(pathToFileURL(file).href);
      assert.equal(await portable.evaluate(() => JSON.stringify(state)), expected);
      assert.equal(await portable.evaluate(() => window.__injected), undefined);
      assert.notEqual(await portable.evaluate(() => instance), 'base');
      await portable.close();
    });
    await check('Falha de armazenamento mantém edição e exportação disponíveis', async () => {
      const limited = await browser.newContext({ acceptDownloads: true });
      await limited.route(/^https?:/, route => { requests.push(route.request().url()); return route.abort(); });
      await limited.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); }; });
      const offline = await limited.newPage(); offline.on('pageerror', error => errors.push(error.message));
      await offline.goto(pathToFileURL(path.join(root, 'index.html')).href);
      const data = await offline.evaluate(() => { state.session.title = 'Sessão em memória'; save(); return { storageOK, title: state.session.title }; });
      assert.deepEqual(data, { storageOK: false, title: 'Sessão em memória' });
      const downloaded = offline.waitForEvent('download'); await offline.evaluate(() => exportJSON()); await (await downloaded).saveAs(path.join(output, 'memory-backup.json'));
      await limited.close();
    });
    await check('Aplicação funciona sem solicitações externas ou erros de execução', async () => {
      assert.deepEqual(requests, []); assert.deepEqual(errors, []);
    });
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ results, errors, requests }, null, 2));
    console.log(`${results.length} cenários passaram. Evidências: ${output}`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); console.error('Evidências parciais: ' + output); process.exitCode = 1; });
