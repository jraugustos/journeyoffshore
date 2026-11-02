const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const flag = process.argv.indexOf('--playwright');
const { chromium } = require(flag < 0 ? 'playwright' : process.argv[flag + 1]);
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const password = process.env.TEST_PROJECT_PASSWORD;
if (!password) throw new Error('Defina TEST_PROJECT_PASSWORD para uma instância isolada de teste.');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'offshore-app-qa-'));
const results = [],
  errors = [];
const check = async (name, action) => {
  await action();
  results.push({ name, result: 'passed' });
  console.log('PASS ' + name);
};

(async () => {
  const browser = await chromium.launch({
    channel: process.env.OFFSHORE_BROWSER_CHANNEL || 'chrome',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.accept());
  const api = context.request,
    headers = { Origin: base };
  let initial, macroId, frontId, systemId, second;
  const state = async () => {
    const response = await api.get(base + '/api/workspace');
    assert.equal(response.status(), 200);
    return response.json();
  };
  const saved = async () => {
    await page
      .getByTestId('save-status')
      .filter({ hasText: 'Todas as alterações salvas' })
      .waitFor();
  };
  const close = async () => {
    await page
      .locator('dialog.oj-dialog')
      .getByRole('button', { name: 'Fechar', exact: true })
      .click();
    await page.locator('dialog.oj-dialog').waitFor({ state: 'hidden' });
  };
  const login = async (target, secret = password) => {
    await target.goto(base);
    await target.getByLabel('Senha', { exact: true }).fill(secret);
    await target.getByRole('button', { name: 'Login' }).click();
  };
  try {
    await check('Páginas e dados são bloqueados sem senha', async () => {
      await page.goto(base);
      assert.match(page.url(), /\/login/);
      assert.equal(await page.locator('input').count(), 1);
      assert.equal(await page.getByText('F001', { exact: true }).count(), 0);
      for (const endpoint of [
        '/api/workspace',
        '/api/export?format=json',
        '/api/export?format=csv',
        '/api/export?format=html',
      ])
        assert.equal((await api.get(base + endpoint)).status(), 401);
      assert.equal(
        (await api.patch(base + '/api/workspace', { data: { changes: [] }, headers })).status(),
        401,
      );
      assert.equal((await api.post(base + '/api/import', { data: {}, headers })).status(), 401);
      for (const endpoint of [
        '/src/data/seed.json',
        '/offshore_workshop_interativo_v17.html',
        '/index.html',
      ])
        assert.equal((await api.get(base + endpoint)).status(), 404);
    });
    await check(
      'Senha compartilhada libera sessão protegida e senha incorreta mantém o bloqueio',
      async () => {
        await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.getByRole('alert').filter({ hasText: 'Senha incorreta' }).waitFor();
        await page.getByLabel('Senha', { exact: true }).fill(password);
        await page.getByRole('button', { name: 'Login' }).click();
        await saved();
        const cookies = await context.cookies();
        const access = cookies.find((cookie) => cookie.name === 'offshore_access');
        assert.ok(access?.httpOnly);
        assert.equal(access.sameSite, 'Strict');
        initial = (await state()).data;
        assert.equal(initial.macros.length, 4);
        assert.equal(initial.boards.length, 8);
        assert.equal(
          await page.getByRole('button', { name: /^Salvar(?: JSON| alterações)?$/ }).count(),
          0,
        );
      },
    );
    await check('Inspeção visual desktop e celular', async () => {
      await page.screenshot({ path: path.join(output, 'workspace-desktop.png') });
      const mobile = await context.newPage();
      mobile.on('pageerror', (error) => errors.push(error.message));
      await mobile.setViewportSize({ width: 390, height: 844 });
      await mobile.goto(base);
      await mobile
        .getByTestId('save-status')
        .filter({ hasText: 'Todas as alterações salvas' })
        .waitFor({ state: 'attached' });
      assert.equal(
        await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
      );
      await mobile.screenshot({ path: path.join(output, 'workspace-mobile.png') });
      await mobile.close();
    });
    await check(
      'Cards pretos permitem renomear macroprocesso com salvamento automático',
      async () => {
        await page
          .getByRole('button', { name: 'Editar macroprocesso Prospecção', exact: true })
          .click();
        await page
          .getByRole('dialog')
          .getByLabel('Nome do macroprocesso')
          .fill('Prospecção e relacionamento');
        await saved();
        assert.equal(
          (await state()).data.macros.find((item) => item.id === 'prospecting').name,
          'Prospecção e relacionamento',
        );
        await close();
        await page.reload();
        await saved();
        await page
          .getByRole('button', {
            name: 'Editar macroprocesso Prospecção e relacionamento',
            exact: true,
          })
          .waitFor();
        assert.equal(
          (await state()).data.boards.find((item) => item.id === 'prospecting').macroId,
          'prospecting',
        );
      },
    );
    await check('Criação e reordenação de macroprocesso persistem sem editar código', async () => {
      await page.getByRole('button', { name: 'Macroprocesso', exact: true }).click();
      await page.locator('dialog.oj-dialog').getByLabel('Nome do macroprocesso').fill('Pós-venda');
      await page.locator('dialog.oj-dialog').getByLabel('Posição no blueprint').selectOption('0');
      await saved();
      const current = (await state()).data;
      macroId = current.macros.find((item) => item.name === 'Pós-venda').id;
      assert.equal(current.macros[0].id, macroId);
      await close();
    });
    await check('Nova frente permanece vinculada ao novo macroprocesso', async () => {
      await page.getByRole('button', { name: 'Adicionar contexto / produto', exact: true }).click();
      await page
        .locator('dialog.oj-dialog')
        .getByLabel('Nome do contexto / produto')
        .fill('Suporte ao relacionamento');
      await saved();
      await close();
      const current = (await state()).data;
      frontId = current.boards.find((item) => item.name === 'Suporte ao relacionamento').id;
      assert.equal(current.boards.find((item) => item.id === frontId).macroId, macroId);
      await page.reload();
      await saved();
      assert.ok(
        (await state()).data.macros.find((item) => item.id === macroId).boards.includes(frontId),
      );
    });
    await check('Cadastros são persistidos automaticamente', async () => {
      await page.getByRole('button', { name: 'Cadastros e responsáveis', exact: true }).click();
      await page.getByRole('button', { name: 'Sistemas', exact: true }).click();
      await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
      await page
        .getByRole('dialog')
        .getByLabel('Nome', { exact: true })
        .fill('Sistema de atendimento');
      await saved();
      await close();
      systemId = (await state()).data.systems.find(
        (item) => item.name === 'Sistema de atendimento',
      ).id;
    });
    await check('Etapa salva objetivo, sistema e fornecedor de dados automaticamente', async () => {
      await page
        .locator('.bp-nav-children')
        .getByRole('button', { name: /Suporte ao relacionamento/ })
        .click();
      await page.getByRole('button', { name: 'Etapa', exact: true }).click();
      const dialog = page.locator('dialog.oj-dialog');
      await dialog.getByLabel('Etapa do processo').fill('Resolver solicitação');
      await dialog.getByLabel('Objetivo do processo').selectOption('Gerenciar');
      await dialog.getByRole('combobox', { name: 'Sistemas', exact: true }).click();
      await dialog.getByRole('checkbox', { name: 'Sistema de atendimento', exact: true }).check();
      await dialog.getByRole('button', { name: 'Adicionar dado', exact: true }).click();
      await dialog.getByLabel('Nome do dado', { exact: true }).fill('Protocolo de atendimento');
      await dialog.getByLabel('Tipo de fornecedor').selectOption('systems');
      await dialog.getByLabel('Fonte do dado').selectOption(systemId);
      await saved();
      await close();
      await page.reload();
      await saved();
      const front = (await state()).data.boards.find((item) => item.id === frontId),
        step = front.cases.find((item) => item.isDefault).steps[0];
      assert.equal(step.name, 'Resolver solicitação');
      assert.equal(step.objective, 'Gerenciar');
      assert.ok(step.systemIds.includes(systemId));
      assert.equal(step.dataRequirements[0].providerId, systemId);
    });
    await check('Edição de oferta e caso de uso permanece após recarga', async () => {
      await page
        .locator('.bp-nav-children')
        .getByRole('button', { name: /Onboarding/ })
        .click();
      await page.getByRole('button', { name: 'Caso de uso', exact: true }).click();
      await page
        .getByRole('dialog')
        .getByLabel('Nome do caso de uso')
        .fill('Caso persistente de entrada');
      await saved();
      await close();
      await page.getByRole('button', { name: 'Oferta e recorte', exact: true }).click();
      await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
      await page
        .getByRole('dialog')
        .getByLabel('Produto ou serviço', { exact: true })
        .fill('Oferta persistente');
      await saved();
      await close();
      await page.reload();
      await saved();
      const front = (await state()).data.boards.find((item) => item.id === 'onboarding');
      assert.ok(front.cases.some((item) => item.title === 'Caso persistente de entrada'));
      assert.ok(front.offers.some((item) => item.title === 'Oferta persistente'));
    });
    await check('Falha de conexão mantém alteração pendente e reenvia ao reconectar', async () => {
      await page
        .getByRole('button', { name: /Editar macroprocesso Pós-venda/, exact: true })
        .click();
      await page.route('**/api/workspace', (route) =>
        route.request().method() === 'PATCH' ? route.abort() : route.continue(),
      );
      await page
        .getByRole('dialog')
        .getByLabel('Nome do macroprocesso')
        .fill('Pós-venda e suporte');
      await page.getByTestId('save-status').filter({ hasText: 'Gravação pendente' }).waitFor();
      assert.equal(
        (await state()).data.macros.find((item) => item.id === macroId).name,
        'Pós-venda',
      );
      await page.unroute('**/api/workspace');
      await saved();
      await close();
      assert.equal(
        (await state()).data.macros.find((item) => item.id === macroId).name,
        'Pós-venda e suporte',
      );
    });
    await check('Responsabilidades por capacidade e contexto são editáveis', async () => {
      await page.getByRole('button', { name: 'Cadastros e responsáveis', exact: true }).click();
      await page.getByRole('button', { name: 'Responsabilidades', exact: true }).click();
      await page.getByRole('button', { name: 'Vínculo', exact: true }).click();
      await page
        .getByRole('dialog')
        .getByLabel('Papel ou responsabilidade')
        .fill('Validar as definições do processo');
      await page
        .getByRole('dialog')
        .getByRole('combobox', { name: 'Responsáveis', exact: true })
        .click();
      await page.locator('dialog.oj-dialog').getByRole('checkbox').first().check();
      await saved();
      await close();
      assert.ok(
        (await state()).data.responsibilities.some(
          (item) => item.role === 'Validar as definições do processo' && item.personIds.length,
        ),
      );
    });
    await check(
      'Decisão final exige responsável e justificativa e gera histórico no servidor',
      async () => {
        await page
          .locator('.bp-nav-children')
          .getByRole('button', { name: /Onboarding/ })
          .click();
        await page.getByRole('button', { name: 'CSD e decisões', exact: true }).click();
        const section = page
          .locator('.oj-record-section')
          .filter({ has: page.getByRole('heading', { name: 'Decisões', exact: true }) });
        await section.getByRole('button', { name: 'Adicionar', exact: true }).click();
        const dialog = page.locator('dialog.oj-dialog');
        await dialog.getByLabel('Título', { exact: true }).fill('Decisão de teste');
        await dialog.getByLabel('Situação da decisão').selectOption('Decisão final');
        await dialog.getByRole('alert').filter({ hasText: 'Informe o responsável' }).waitFor();
        await dialog.getByLabel('Responsável', { exact: true }).fill('Equipe do projeto');
        await dialog
          .getByLabel('Escolha e justificativa')
          .fill('Evidência registrada no workshop.');
        await dialog.getByLabel('Situação da decisão').selectOption('Decisão final');
        await saved();
        await close();
        const front = (await state()).data.boards.find((item) => item.id === 'onboarding'),
          decision = front.decisions.find((item) => item.title === 'Decisão de teste');
        assert.equal(decision.status, 'Decisão final');
        assert.ok(
          front.decisionHistory.some(
            (item) =>
              item.decisionUid === decision.uid &&
              item.after.rationale === 'Evidência registrada no workshop.',
          ),
        );
      },
    );
    await check(
      'Mesma senha funciona em outro navegador e conflitos não sobrescrevem dados',
      async () => {
        second = await browser.newContext();
        const other = await second.newPage();
        await login(other);
        await other
          .getByTestId('save-status')
          .filter({ hasText: 'Todas as alterações salvas' })
          .waitFor();
        const original = (await state()).data.macros.find((item) => item.id === macroId).name;
        const change = {
          collection: 'macros',
          id: macroId,
          field: 'name',
          before: original,
          value: 'Alteração da sessão A',
        };
        assert.equal(
          (
            await api.patch(base + '/api/workspace', { data: { changes: [change] }, headers })
          ).status(),
          200,
        );
        const conflict = await second.request.patch(base + '/api/workspace', {
          data: { changes: [{ ...change, value: 'Alteração da sessão B' }] },
          headers,
        });
        assert.equal(conflict.status(), 409);
        assert.equal(
          (await state()).data.macros.find((item) => item.id === macroId).name,
          'Alteração da sessão A',
        );
        await second.close();
        second = null;
      },
    );
    await check(
      'Origem indevida e importação inválida são rejeitadas sem alterar o banco',
      async () => {
        const before = await state();
        assert.equal(
          (
            await api.patch(base + '/api/workspace', {
              data: { changes: [] },
              headers: { Origin: 'https://invalid.example' },
            })
          ).status(),
          403,
        );
        assert.equal(
          (
            await api.post(base + '/api/import', {
              data: { revision: before.revision, data: { schema: 999, boards: [] } },
              headers,
            })
          ).status(),
          400,
        );
        assert.deepEqual((await state()).data, before.data);
      },
    );
    await check('Exportações JSON, CSV e HTML contêm o trabalho persistido', async () => {
      const json = await api.get(base + '/api/export?format=json');
      assert.equal(json.status(), 200);
      const backup = await json.json();
      assert.ok(backup.macros.some((item) => item.id === macroId));
      assert.ok(backup.v13ArchivedDefaults.removedCases.length);
      assert.ok(!JSON.stringify(backup).includes('PROJECT_PASSWORD_HASH'));
      for (const kind of ['cases', 'csd', 'actions', 'progress', 'features']) {
        const csv = await api.get(base + '/api/export?format=csv&kind=' + kind);
        assert.equal(csv.status(), 200);
        assert.match(csv.headers()['content-type'], /text\/csv/);
      }
      const html = await api.get(base + '/api/export?format=html');
      assert.equal(html.status(), 200);
      assert.ok((await html.text()).includes('Resolver solicitação'));
    });
    await check('Restauração JSON é atômica e recusa uma revisão antiga', async () => {
      const current = await state();
      assert.equal(
        (
          await api.post(base + '/api/import', {
            data: { data: initial, revision: current.revision - 1 },
            headers,
          })
        ).status(),
        409,
      );
      assert.equal(
        (
          await api.post(base + '/api/import', {
            data: { data: initial, revision: current.revision },
            headers,
          })
        ).status(),
        200,
      );
      assert.equal((await state()).data.macros.length, 4);
      await page.reload();
      await saved();
    });
    await check('Encerrar acesso revoga a sessão e volta a bloquear os dados', async () => {
      await page.getByRole('button', { name: 'Encerrar acesso', exact: true }).click();
      await page.getByLabel('Senha', { exact: true }).waitFor();
      assert.equal((await api.get(base + '/api/workspace')).status(), 401);
      await page.screenshot({ path: path.join(output, 'login-desktop.png') });
    });
    await check('Nenhum erro de execução na interface', async () => {
      assert.deepEqual(errors, []);
    });
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    console.log(`${results.length} cenários passaram. Evidências: ${output}`);
  } finally {
    if (second) await second.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  console.error('Evidências parciais: ' + output);
  process.exitCode = 1;
});
