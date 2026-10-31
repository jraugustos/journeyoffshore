const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const sharp = require('sharp');
const base = process.env.TEST_BASE_URL;
const password = process.env.TEST_PROJECT_PASSWORD;
if (!base || !password)
  throw new Error('Use uma instância isolada com TEST_BASE_URL e TEST_PROJECT_PASSWORD.');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'offshore-fidelity-qa-'));
const results = [],
  errors = [];
const check = async (name, action) => {
  await action();
  results.push({ name, result: 'passed' });
  console.log('PASS ' + name);
};
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(error.message));
  const api = context.request,
    headers = { Origin: base };
  const state = async () => {
    const r = await api.get(base + '/api/workspace');
    assert.equal(r.status(), 200);
    return r.json();
  };
  const saved = () =>
    page.getByTestId('save-status').filter({ hasText: 'Todas as alterações salvas' }).waitFor();
  const close = async () => {
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
  };
  const nav = async (name) => page.getByRole('button', { name, exact: true }).click();
  let initial;
  try {
    await page.goto(base);
    await page.getByLabel('Senha do projeto', { exact: true }).fill(password);
    await nav('Acessar projeto');
    await saved();
    initial = (await state()).data;
    const fixture = structuredClone(initial);
    fixture.people.push({
      id: 'qa-photo',
      name: 'Pessoa de referência',
      status: 'Ativo',
      role: 'Responsável pelo projeto',
    });
    fixture.systems.push({
      id: 'qa-system',
      name: 'Sistema com ícone',
      status: 'Ativo',
      icon: 'server',
      color: '#286b9e',
    });
    fixture.capabilities.push({
      id: 'qa-capability',
      name: 'Capacidade com ícone',
      status: 'Ativo',
      icon: 'shield',
      color: '#626c7c',
    });
    fixture.operations.push({
      id: 'qa-operation',
      name: 'Operação com bandeira',
      status: 'Ativo',
      country: 'BR',
      icon: 'building',
      color: '#535b68',
    });
    fixture.macros[0].ownerIds = ['qa-photo'];
    const front = fixture.boards.find((b) => b.cases.some((c) => c.isDefault && c.steps.length)),
      item = front.cases.find((c) => c.isDefault),
      step = item.steps[0];
    step.systemIds = ['qa-system'];
    step.capabilityIds = ['qa-capability'];
    step.operationLinks = [{ areaId: 'qa-operation', role: 'Conferir cadastro' }];
    step.release = 'Release A';
    front.ownerIds = ['qa-photo'];
    assert.equal(
      (
        await api.post(base + '/api/import', {
          headers,
          data: { revision: (await state()).revision, data: fixture },
        })
      ).status(),
      200,
    );
    await page.reload();
    await saved();
    await check('Módulos removidos da navegação', async () => {
      assert.equal(
        await page.getByRole('button', { name: 'Configurar workshop', exact: true }).count(),
        0,
      );
      assert.equal(
        await page.getByRole('button', { name: 'Registros preservados', exact: true }).count(),
        0,
      );
    });
    await check('Foto com corte e otimização, salvamento automático e recarga', async () => {
      await nav('Cadastros e responsáveis');
      await page
        .locator('.oj-simple-row')
        .filter({ hasText: 'Pessoa de referência' })
        .getByRole('button', { name: 'Editar', exact: true })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog.locator('input[type=file]').setInputFiles({
        name: 'arquivo.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('arquivo inválido'),
      });
      await dialog.getByRole('alert').filter({ hasText: 'Escolha uma imagem' }).waitFor();
      await dialog.locator('input[type=file]').setInputFiles({
        name: 'foto.png',
        mimeType: 'image/png',
        buffer: await sharp({
          create: { width: 360, height: 240, channels: 3, background: '#257a75' },
        })
          .png()
          .toBuffer(),
      });
      await dialog.getByRole('button', { name: 'Remover foto' }).waitFor();
      await saved();
      const person = (await state()).data.people.find((p) => p.id === 'qa-photo');
      assert.match(person.photo, /^data:image\/jpeg;base64,/);
      const meta = await sharp(Buffer.from(person.photo.split(',')[1], 'base64')).metadata();
      assert.equal(meta.width, 176);
      assert.equal(meta.height, 176);
      await page.screenshot({ path: path.join(output, 'editor-foto-desktop.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(output, 'editor-foto-mobile.png') });
      assert.ok(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1));
      await page.setViewportSize({ width: 1440, height: 1000 });
      await close();
      await page.reload();
      await saved();
      assert.ok(await page.locator('.oj-product img[alt="Foto de Pessoa de referência"]').count());
      await nav('Cadastros e responsáveis');
      assert.equal(
        await page.getByRole('img', { name: 'Foto de Pessoa de referência', exact: true }).count(),
        1,
      );
    });
    await check('País e bandeira da operação persistem e aparecem no blueprint', async () => {
      await nav('Áreas operacionais');
      const row = page.locator('.oj-simple-row').filter({ hasText: 'Operação com bandeira' });
      assert.equal(await row.getByRole('img', { name: 'Brasil', exact: true }).count(), 1);
      await row.getByRole('button', { name: 'Editar', exact: true }).click();
      await page.getByRole('dialog').locator('input[name=country][value=US]').check();
      await saved();
      await close();
      assert.equal(
        (await state()).data.operations.find((p) => p.id === 'qa-operation').country,
        'US',
      );
      assert.equal(await row.getByRole('img', { name: 'EUA', exact: true }).count(), 1);
    });
    await check('Ícones e cores configuráveis em sistemas e capacidades', async () => {
      for (const [tab, name, icon, color] of [
        ['Sistemas', 'Sistema com ícone', 'database', '#7547a4'],
        ['Capacidades', 'Capacidade com ícone', 'workflow', '#37845c'],
      ]) {
        await nav(tab);
        await page
          .locator('.oj-simple-row')
          .filter({ hasText: name })
          .getByRole('button', { name: 'Editar', exact: true })
          .click();
        await page
          .getByRole('dialog')
          .locator('input[name=icon][value="' + icon + '"]')
          .check();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Usar cor ' + color, exact: true })
          .click();
        await saved();
        await close();
      }
      await nav('Visão geral');
      for (const name of ['Sistema com ícone', 'Capacidade com ícone'])
        assert.ok(
          await page.locator('.v11-tag').filter({ hasText: name }).locator('svg path').count(),
        );
      assert.ok(await page.getByRole('img', { name: 'EUA', exact: true }).count());
      await page.screenshot({ path: path.join(output, 'blueprint-visuals-desktop.png') });
      const current = (await state()).data;
      assert.equal(current.systems.find((p) => p.id === 'qa-system').icon, 'database');
      assert.equal(current.capabilities.find((p) => p.id === 'qa-capability').color, '#37845c');
    });
    await check('Timeline horizontal, paleta original e expansão do catálogo', async () => {
      await nav('Launch Timeline');
      assert.equal(await page.locator('.lt-entry').count(), 11);
      assert.equal(await page.locator('.lt-phase-head .lt-phase').count(), 6);
      assert.deepEqual(
        await page
          .locator('.lt-phase.future')
          .evaluateAll((items) => items.map((el) => getComputedStyle(el).backgroundColor)),
        [
          'rgb(196, 60, 50)',
          'rgb(229, 181, 47)',
          'rgb(66, 131, 87)',
          'rgb(47, 118, 183)',
          'rgb(123, 86, 180)',
        ],
      );
      assert.equal(await page.locator('.lt-track .lt-marker').count(), 11);
      assert.deepEqual(
        await page
          .locator('.oj-phase-legend .oj-phase')
          .evaluateAll((items) => items.map((el) => getComputedStyle(el).backgroundColor)),
        [
          'rgb(251, 236, 233)',
          'rgb(255, 246, 217)',
          'rgb(234, 244, 237)',
          'rgb(234, 242, 253)',
          'rgb(242, 235, 250)',
        ],
      );
      await page.screenshot({ path: path.join(output, 'timeline-desktop.png') });
      await nav('Expandir tudo');
      await page.waitForFunction(() => document.querySelectorAll('.lt-entry[open]').length === 11);
      await page.locator('.lt-cat').first().locator('summary').click();
      assert.ok(await page.locator('.lt-prod-row:visible').count());
      await page.locator('.lt-feature').first().click();
      await page.getByRole('dialog').waitFor();
      await close();
      await nav('Recolher tudo');
      await page.waitForFunction(() => !document.querySelector('.lt-entry[open]'));
      await page.getByLabel('Marco da timeline').selectOption('Release D');
      assert.ok(await page.locator('.lt-entry').count());
      for (const phase of await page
        .locator('.lt-entry')
        .evaluateAll((items) => items.map((el) => el.style.getPropertyValue('--tone'))))
        assert.equal(phase, '#7b56b4');
      await page.getByLabel('Marco da timeline').selectOption('all');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(output, 'timeline-mobile.png'), fullPage: true });
      assert.ok(await page.locator('.lt-scroll').evaluate((el) => el.scrollWidth > el.clientWidth));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.setViewportSize({ width: 1440, height: 1000 });
    });
    await check('Exportações e importação mantêm fotos, país, ícones e históricos', async () => {
      const r = await api.get(base + '/api/export?format=json');
      assert.equal(r.status(), 200);
      const exported = await r.json();
      const data = exported.data || exported;
      assert.equal(
        data.people.find((p) => p.id === 'qa-photo').photo,
        (await state()).data.people.find((p) => p.id === 'qa-photo').photo,
      );
      assert.equal(data.operations.find((p) => p.id === 'qa-operation').country, 'US');
      assert.equal(data.systems.find((p) => p.id === 'qa-system').icon, 'database');
      assert.deepEqual(data.v13ArchivedDefaults, initial.v13ArchivedDefaults);
      const html = await api.get(base + '/api/export?format=html');
      assert.equal(html.status(), 200);
      assert.ok((await html.text()).includes('data:image/jpeg;base64,'));
      assert.equal(
        (
          await api.post(base + '/api/import', {
            headers,
            data: { data, revision: (await state()).revision },
          })
        ).status(),
        200,
      );
      await page.reload();
      await saved();
      await nav('Cadastros e responsáveis');
      const row = page.locator('.oj-simple-row').filter({ hasText: 'Pessoa de referência' });
      await row.getByRole('button', { name: 'Editar', exact: true }).click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Remover foto', exact: true })
        .click();
      await saved();
      assert.equal((await state()).data.people.find((p) => p.id === 'qa-photo').photo, '');
      await close();
    });
    await check('Interface sem erros de execução', async () => assert.deepEqual(errors, []));
  } finally {
    if (initial) {
      const current = await state();
      const r = await api.post(base + '/api/import', {
        headers,
        data: { data: initial, revision: current.revision },
      });
      assert.equal(r.status(), 200);
    }
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    await browser.close();
    console.log('Evidências: ' + output);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
