const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.TEST_BASE_URL;
const password = process.env.TEST_PROJECT_PASSWORD;
if (!base || !password) throw new Error('Defina uma instância isolada de teste.');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'offshore-structure-qa-'));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(),
    api = context.request,
    errors = [],
    results = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.accept());
  page.setDefaultTimeout(15000);
  const saved = () =>
    page.getByTestId('save-status').filter({ hasText: 'Todas as alterações salvas' }).waitFor();
  const state = async () => {
    const response = await api.get(base + '/api/workspace');
    assert.equal(response.status(), 200);
    return response.json();
  };
  const close = async () => {
    await saved();
    await page
      .locator('dialog.oj-dialog')
      .getByRole('button', { name: 'Fechar', exact: true })
      .click();
    await page.locator('dialog.oj-dialog').waitFor({ state: 'hidden' });
  };
  const insert = async (label) => {
    let button = page.getByRole('button', { name: label, exact: true });
    if (!(await button.count())) button = page.locator('[data-insert-alternative="' + label + '"]');
    await button.scrollIntoViewIfNeeded();
    await button.locator('..').hover();
    await button.click();
    const choice = page.getByRole('dialog', { name: 'Posição do novo item', exact: true });
    if (await choice.count())
      await choice.getByRole('button', { name: label, exact: true }).click();
  };
  const rename = async (label, name) => {
    await page.locator('dialog.oj-dialog').getByLabel(label, { exact: true }).fill(name);
    await close();
  };
  const check = async (name, action) => {
    await action();
    results.push({ name, result: 'passed' });
    console.log('PASS ' + name);
  };
  let initial, macroId, frontId, beforeStepId;
  try {
    await page.goto(base);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await saved();
    initial = (await state()).data;
    await check('Insere macroprocesso na divisória, com persistência após recarregar', async () => {
      await insert('Adicionar macroprocesso depois de ' + initial.macros[0].name);
      await rename('Nome do macroprocesso', 'Operação personalizada');
      let current = (await state()).data;
      macroId = current.macros.find((m) => m.name === 'Operação personalizada').id;
      assert.equal(current.macros[1].id, macroId);
      await page.reload();
      await saved();
      assert.equal((await state()).data.macros[1].id, macroId);
    });
    await check('Cria e edita contexto/produto na própria blueprint', async () => {
      await page.getByRole('button', { name: 'Adicionar contexto / produto', exact: true }).click();
      await rename('Nome do contexto / produto', 'Produto Alfa');
      let current = (await state()).data;
      frontId = current.boards.find((b) => b.name === 'Produto Alfa').id;
      await page
        .getByRole('button', { name: 'Editar contexto / produto Produto Alfa', exact: true })
        .click();
      await page
        .locator('dialog.oj-dialog')
        .getByLabel('Descrição', { exact: true })
        .fill('Contexto adaptável ao projeto');
      await close();
      await insert('Adicionar contexto / produto antes de Produto Alfa');
      await rename('Nome do contexto / produto', 'Produto Beta');
      current = (await state()).data;
      assert.deepEqual(
        current.boards.filter((b) => b.macroId === macroId).map((b) => b.name),
        ['Produto Beta', 'Produto Alfa'],
      );
      await page
        .getByRole('button', { name: 'Editar contexto / produto Produto Alfa', exact: true })
        .click();
      await page.getByLabel('Posição no macroprocesso', { exact: true }).selectOption('0');
      await close();
      assert.deepEqual(
        (await state()).data.boards.filter((b) => b.macroId === macroId).map((b) => b.name),
        ['Produto Alfa', 'Produto Beta'],
      );
    });
    await check('Etapas vazias e inserção entre etapas no caso correto', async () => {
      const front = page.locator('.oj-product').filter({ hasText: 'Produto Alfa' });
      await front.getByRole('button', { name: 'Produto Alfa', exact: true }).click();
      await insert('Adicionar primeira etapa em Produto Alfa');
      await rename('Etapa do processo', 'Concluir');
      await insert('Adicionar etapa antes de Concluir');
      await rename('Etapa do processo', 'Iniciar');
      await insert('Adicionar etapa depois de Iniciar');
      await rename('Etapa do processo', 'Validar');
      let board = (await state()).data.boards.find((b) => b.id === frontId);
      assert.deepEqual(
        board.cases.find((c) => c.isDefault).steps.map((s) => s.name),
        ['Iniciar', 'Validar', 'Concluir'],
      );
      beforeStepId = board.cases.find((c) => c.isDefault).steps[0].uid;
      await page.reload();
      await saved();
      await page
        .locator('.oj-product')
        .getByRole('button', { name: 'Produto Alfa', exact: true })
        .click();
      assert.equal(await page.locator('.oj-step').count(), 3);
      assert.equal(
        await page
          .locator('.oj-product')
          .getByRole('button', { name: 'Editar contexto / produto Produto Alfa' })
          .count(),
        1,
      );
    });
    await check(
      'Inserção com filtro ativo usa a ordem completa e revela a nova etapa',
      async () => {
        await page.getByRole('button', { name: 'Alterar marco de Iniciar', exact: true }).click();
        await page
          .getByRole('dialog')
          .getByLabel('Marco desta etapa', { exact: true })
          .selectOption('Day-1');
        await page.keyboard.press('Escape');
        await saved();
        await page.getByRole('button', { name: 'Alterar marco de Concluir', exact: true }).click();
        await page
          .getByRole('dialog')
          .getByLabel('Marco desta etapa', { exact: true })
          .selectOption('Day-1');
        await page.keyboard.press('Escape');
        await saved();
        await page.locator('.bp-toolbar').getByLabel('Marco da etapa').selectOption('Day-1');
        assert.equal(await page.locator('.oj-step').count(), 2);
        await insert('Adicionar etapa depois de Iniciar');
        await rename('Etapa do processo', 'Conferir dados');
        const board = (await state()).data.boards.find((b) => b.id === frontId);
        assert.deepEqual(
          board.cases.find((c) => c.isDefault).steps.map((s) => s.name),
          ['Iniciar', 'Conferir dados', 'Validar', 'Concluir'],
        );
        assert.equal(await page.locator('.oj-step').count(), 4);
      },
    );
    await check(
      'Teclado e visual desktop: inserção visível ao focar sem alterar as colunas',
      async () => {
        const button = page.getByRole('button', {
          name: 'Adicionar etapa depois de Iniciar',
          exact: true,
        });
        await button.focus();
        assert.equal(await button.evaluate((el) => getComputedStyle(el).opacity), '1');
        const widths = await page
          .locator('.oj-step')
          .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
        assert.ok(widths.every((w) => Math.abs(w - widths[0]) < 1));
        const heading = page.locator('.oj-step').first();
        await heading.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, 'structure-desktop.png') });
        await page.keyboard.press('Enter');
        await rename('Etapa do processo', 'Inserida pelo teclado');
      },
    );
    await check(
      'Contexto criado na frente fica acessível, pode ser movido e excluído',
      async () => {
        await insert('Adicionar contexto / produto depois de Produto Alfa');
        await rename('Nome do contexto / produto', 'Produto Gama');
        assert.equal(await page.locator('.board-head h1').innerText(), 'Produto Gama');
        await page
          .getByRole('button', { name: 'Editar contexto / produto Produto Gama', exact: true })
          .click();
        await page
          .locator('dialog.oj-dialog')
          .getByLabel('Macroprocesso', { exact: true })
          .selectOption(initial.macros[0].id);
        await close();
        const current = (await state()).data,
          gamma = current.boards.find((b) => b.name === 'Produto Gama');
        assert.equal(gamma.macroId, initial.macros[0].id);
        assert.ok(gamma.cases.every((c) => c.macroId === gamma.macroId));
        await page
          .getByRole('button', { name: 'Editar contexto / produto Produto Gama', exact: true })
          .click();
        await page
          .locator('dialog.oj-dialog')
          .getByRole('button', { name: 'Excluir contexto / produto', exact: true })
          .click();
        await saved();
        assert.equal(
          (await state()).data.boards.some((b) => b.id === gamma.id),
          false,
        );
      },
    );
    await check('Visão geral espelha alterações e exportação preserva estrutura', async () => {
      const current = (await state()).data;
      assert.equal(
        current.boards.find((b) => b.id === frontId).summary,
        'Contexto adaptável ao projeto',
      );
      assert.equal(
        current.boards.find((b) => b.id === frontId).cases.find((c) => c.isDefault).steps[0].uid,
        beforeStepId,
      );
      await page.getByRole('button', { name: 'Visão geral', exact: true }).click();
      const button = page.getByRole('button', {
        name: 'Editar contexto / produto Produto Alfa',
        exact: true,
      });
      await button.scrollIntoViewIfNeeded();
      assert.equal(await button.count(), 1);
      const response = await api.get(base + '/api/export?format=json');
      assert.equal(response.status(), 200);
      const exported = await response.text();
      assert.ok(exported.includes('Produto Alfa') && exported.includes('Conferir dados'));
    });
    await check('Celular e toque mantêm ações acessíveis e layout dentro da tela', async () => {
      const mobile = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        storageState: await context.storageState(),
      });
      const phone = await mobile.newPage();
      await phone.goto(base);
      await phone
        .getByTestId('save-status')
        .filter({ hasText: 'Todas as alterações salvas' })
        .waitFor({ state: 'attached' });
      const button = phone.getByRole('button', {
        name: 'Adicionar macroprocesso depois de ' + initial.macros[0].name,
        exact: true,
      });
      await button.scrollIntoViewIfNeeded();
      assert.equal(await button.evaluate((el) => getComputedStyle(el).opacity), '1');
      assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await phone.screenshot({ path: path.join(output, 'structure-mobile.png') });
      await mobile.close();
    });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify({ results, pageErrors: errors }, null, 2),
    );
    console.log('Evidências: ' + output);
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
    console.error(error.message);
    console.error('Evidências: ' + output);
    process.exitCode = 1;
  } finally {
    if (initial) {
      const current = await state();
      const restored = await api.post(base + '/api/import', {
        headers: { Origin: base },
        data: { revision: current.revision, data: initial },
      });
      assert.equal(restored.status(), 200);
    }
    await browser.close();
  }
})();
