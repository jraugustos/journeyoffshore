const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.TEST_BASE_URL,
  password = process.env.TEST_PROJECT_PASSWORD;
if (!base || !password) throw Error('Use uma instância isolada.');
(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'offshore-study-qa-'));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(),
    api = context.request,
    errors = [],
    results = [];
  let initial;
  page.on('pageerror', (e) => errors.push(e.message));
  page.setDefaultTimeout(12000);
  const saved = () =>
    page.getByTestId('save-status').filter({ hasText: 'Todas as alterações salvas' }).waitFor();
  const state = async () => {
    const r = await api.get(base + '/api/workspace');
    assert.equal(r.status(), 200);
    return r.json();
  };
  const close = async () => {
    await saved();
    await page
      .locator('dialog.oj-dialog')
      .getByRole('button', { name: 'Fechar', exact: true })
      .click();
  };
  const nav = async (name) => page.getByRole('button', { name, exact: true }).click();
  const check = async (name, fn) => {
    await fn();
    results.push({ name, result: 'passed' });
    console.log('PASS ' + name);
  };
  try {
    await page.goto(base);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await nav('Login');
    await saved();
    initial = (await state()).data;
    let id, boardId;
    await check('Criar e editar funcionalidade persiste e exporta', async () => {
      await nav('Funcionalidades');
      await nav('Adicionar funcionalidade');
      await page
        .getByLabel('Funcionalidade', { exact: true })
        .fill('Fluxo personalizado de abertura');
      await page.getByLabel('Público', { exact: true }).fill('Cliente');
      id = await page.getByLabel('Código da funcionalidade').inputValue();
      await close();
      await page.reload();
      await saved();
      await nav('Funcionalidades');
      await page.getByRole('button').filter({ hasText: 'Fluxo personalizado de abertura' }).click();
      await page.getByLabel('Funcionalidade', { exact: true }).fill('Fluxo personalizado revisado');
      await close();
      const s = await state();
      assert.equal(
        s.data.featureCatalog.find((f) => f.id === id).funcionalidade,
        'Fluxo personalizado revisado',
      );
      for (const format of ['json', 'csv', 'html']) {
        const r = await api.get(
          base + '/api/export?format=' + format + (format === 'csv' ? '&kind=features' : ''),
        );
        assert.equal(r.status(), 200);
        assert.ok((await r.text()).includes('Fluxo personalizado revisado'));
      }
    });
    await check('Casos alternativos e marcos da blueprint alimentam a timeline', async () => {
      const s = await state(),
        fixture = structuredClone(s.data),
        board = fixture.boards.find((b) => b.cases.find((c) => c.isDefault).steps.length >= 2);
      boardId = board.id;
      board.name = 'Onboarding QA';
      const standard = board.cases.find((c) => c.isDefault);
      standard.title = 'Abertura padrão';
      standard.steps = standard.steps.slice(0, 2);
      standard.steps[0].release = 'Day-1';
      standard.steps[0].featureIds = [id];
      standard.steps[1].release = '';
      const digital = structuredClone(standard);
      digital.uid = 'qa-digital';
      digital.isDefault = false;
      digital.title = 'Abertura digital';
      digital.steps = digital.steps.slice(0, 1);
      digital.steps[0].uid = 'qa-step-digital';
      digital.steps[0].release = 'Release C';
      const commercial = structuredClone(digital);
      commercial.uid = 'qa-commercial';
      commercial.title = 'Abertura via comercial';
      commercial.steps = [];
      board.cases = [standard, digital, commercial];
      const cap = fixture.capabilities[0],
        person = fixture.people[0];
      standard.steps[0].capabilityIds = [cap.id];
      cap.ownerIds = [person.id];
      await api.post(base + '/api/import', {
        headers: { Origin: base },
        data: { revision: s.revision, data: fixture },
      });
      await page.reload();
      await saved();
      await nav('Launch Timeline');
      assert.equal(await page.locator('[data-launch-id]').count(), 11);
      await nav('Timeline Aprofundada');
      const row = page.locator('[data-study-case="qa-digital"]');
      await row.locator('summary').click();
      assert.equal(await row.locator('[data-study-phase="Release C"]').count(), 1);
      assert.equal(
        await page.locator('[data-study-case="qa-commercial"] [data-study-phase="none"]').count(),
        1,
      );
      await page.screenshot({ path: path.join(output, 'timeline-desktop.png') });
      await row.getByRole('button', { name: digital.steps[0].name, exact: true }).click();
      await page.getByLabel('Marco desta etapa', { exact: true }).selectOption('Release D');
      await close();
      assert.equal(await row.locator('[data-study-phase="Release D"]').count(), 1);
      await nav('Timeline Planejada');
      assert.equal(await page.locator('[data-launch-id]').count(), 11);
    });
    await check(
      'Capacidade contém seus responsáveis e permite criar funcionalidade na etapa',
      async () => {
        await nav('Visão geral');
        await page
          .locator('.oj-product')
          .getByRole('button', { name: 'Onboarding QA', exact: true })
          .click();
        const card = page.locator('.oj-capability-responsibility').first();
        assert.equal(await card.locator('.oj-capability-owners .v15-owner').count(), 1);
        assert.ok(await card.evaluate((el) => getComputedStyle(el).borderTopWidth === '1px'));
        await card.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, 'capabilities-desktop.png') });
        await page.locator('.bp-functional details').first().locator('summary').click();
        await page.getByRole('button', { name: 'Vincular ou criar', exact: true }).first().click();
        const popup = page.locator('.oj-field-popover');
        await popup.locator('input[type=search]').fill('Funcionalidade criada na etapa');
        await popup.getByRole('button', { name: /Cadastrar/ }).click();
        await page.keyboard.press('Escape');
        await saved();
        assert.ok(
          (await state()).data.featureCatalog.some(
            (f) => f.funcionalidade === 'Funcionalidade criada na etapa',
          ),
        );
      },
    );
    await check('Conferência móvel e erros de execução', async () => {
      await nav('Launch Timeline');
      await nav('Timeline Aprofundada');
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: path.join(output, 'timeline-mobile.png') });
      assert.deepEqual(errors, []);
    });
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    console.log('Evidências: ' + output);
  } catch (e) {
    await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
    console.error(e.message);
    console.error('Evidências: ' + output);
    process.exitCode = 1;
  } finally {
    if (initial) {
      const s = await state();
      assert.equal(
        (
          await api.post(base + '/api/import', {
            headers: { Origin: base },
            data: { revision: s.revision, data: initial },
          })
        ).status(),
        200,
      );
    }
    await browser.close();
  }
})();
