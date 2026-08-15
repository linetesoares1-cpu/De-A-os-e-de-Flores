const SPREADSHEET_ID = '1V2njaZXlwX3EAhmYReHrmk3I90XeL1OPSXS7oPlZY7U';

// Chave de acesso da área de gerenciamento.
// Para trocar: no editor do Apps Script, Configurações do projeto > Propriedades do script,
// crie a propriedade CHAVE_ADMIN com a nova chave. Ela vale na hora, sem mexer no código.
function getChaveAdmin() {
  return PropertiesService.getScriptProperties().getProperty('CHAVE_ADMIN') || 'acoseflores2026';
}

function doGet(e) {
  let action = e && e.parameter ? e.parameter.action : 'getAll';
  let result = {};

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'getAll' || !action) {
      result = {
        status: 'success',
        participantes: participantesPublicos(ss),
        conteudos: getDadosAba(ss, 'Conteúdos')
      };
    } else if (action === 'getParticipantes') {
      result = { status: 'success', data: participantesPublicos(ss) };
    } else if (action === 'getConteudos') {
      result = { status: 'success', data: getDadosAba(ss, 'Conteúdos') };
    } else {
      result = { status: 'error', message: 'Ação não especificada ou inválida.' };
    }
  } catch (error) {
    result = { status: 'error', message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let rawContent = e && e.postData ? e.postData.contents : '{}';
    let dados = JSON.parse(rawContent);

    if (dados.action === 'cadastrarParticipante') {
      return responderJson(salvarParticipante(dados.payload));
    }

    // ---- Ações administrativas (exigem a chave de acesso) ----
    const acoesAdmin = ['adminListarConteudos', 'adminSalvarConteudo', 'adminAlternarAtivo', 'adminListarParticipantes'];
    if (acoesAdmin.indexOf(dados.action) !== -1) {
      if (!dados.chave || dados.chave !== getChaveAdmin()) {
        return responderJson({ status: 'error', message: 'Chave de acesso inválida.' });
      }

      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

      if (dados.action === 'adminListarConteudos') {
        return responderJson({ status: 'success', data: getDadosAba(ss, 'Conteúdos', true) });
      }
      if (dados.action === 'adminListarParticipantes') {
        return responderJson({ status: 'success', data: getDadosAba(ss, 'Participantes', true) });
      }
      if (dados.action === 'adminSalvarConteudo') {
        return responderJson(salvarConteudo(ss, dados.payload));
      }
      if (dados.action === 'adminAlternarAtivo') {
        return responderJson(alternarAtivo(ss, dados.payload));
      }
    }

    return responderJson({ status: 'error', message: 'Ação POST desconhecida.' });

  } catch (error) {
    return responderJson({ status: 'error', message: error.toString() });
  }
}

// Versão pública da lista de participantes: só campos não sensíveis.
// Contato, gênero, estado civil e sonhos ficam restritos à área de gerenciamento (com chave).
function participantesPublicos(ss) {
  return getDadosAba(ss, 'Participantes').map(function (p) {
    return { id: p.id, nome: p.nome, localidade: p.localidade };
  });
}

function responderJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function salvarParticipante(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const aba = ss.getSheetByName('Participantes');

  if (!aba) {
    return { status: 'error', message: 'Aba Participantes não encontrada.' };
  }

  let novoId = proximoId(aba);
  let dataAtual = new Date();

  let novaLinha = [
    novoId,
    dataAtual,
    payload.login_contato || '',
    payload.nome || '',
    payload.faixa_etaria || '',
    payload.localidade || '',
    payload.genero || '',
    payload.estado_civil || '',
    payload.objetivo_site || '',
    payload.sonhos_objetivos_vida || '',
    true
  ];

  aba.appendRow(novaLinha);

  return {
    status: 'success',
    message: 'Participante cadastrada com sucesso!',
    id: novoId
  };
}

// Cria um conteúdo novo (sem id no payload) ou atualiza um existente (com id).
// Colunas da aba Conteúdos: id, tipo_conteudo, texto_conteudo, autor, video_url, ativo
function salvarConteudo(ss, payload) {
  const aba = ss.getSheetByName('Conteúdos');
  if (!aba) {
    return { status: 'error', message: 'Aba Conteúdos não encontrada.' };
  }

  if (payload.id) {
    let linha = encontrarLinhaPorId(aba, payload.id);
    if (linha === -1) {
      return { status: 'error', message: 'Conteúdo com id ' + payload.id + ' não encontrado.' };
    }
    aba.getRange(linha, 2, 1, 5).setValues([[
      payload.tipo_conteudo || '',
      payload.texto_conteudo || '',
      payload.autor || '',
      payload.video_url || '',
      payload.ativo === false ? false : true
    ]]);
    return { status: 'success', message: 'Conteúdo atualizado com sucesso!', id: payload.id };
  }

  let novoId = proximoId(aba);
  aba.appendRow([
    novoId,
    payload.tipo_conteudo || '',
    payload.texto_conteudo || '',
    payload.autor || '',
    payload.video_url || '',
    payload.ativo === false ? false : true
  ]);
  return { status: 'success', message: 'Conteúdo criado com sucesso!', id: novoId };
}

// Liga/desliga a coluna "ativo" de um registro (Conteúdos ou Participantes)
function alternarAtivo(ss, payload) {
  const nomeAba = payload.aba === 'Participantes' ? 'Participantes' : 'Conteúdos';
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) {
    return { status: 'error', message: 'Aba ' + nomeAba + ' não encontrada.' };
  }

  let linha = encontrarLinhaPorId(aba, payload.id);
  if (linha === -1) {
    return { status: 'error', message: 'Registro com id ' + payload.id + ' não encontrado.' };
  }

  const colunaAtivo = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].indexOf('ativo') + 1;
  if (colunaAtivo === 0) {
    return { status: 'error', message: 'Coluna ativo não encontrada.' };
  }

  aba.getRange(linha, colunaAtivo).setValue(payload.ativo === true);
  return { status: 'success', message: payload.ativo ? 'Registro ativado.' : 'Registro desativado.', id: payload.id };
}

function encontrarLinhaPorId(aba, id) {
  const ids = aba.getRange(2, 1, Math.max(aba.getLastRow() - 1, 1), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (Number(ids[i][0]) === Number(id)) {
      return i + 2; // +2 porque começa na linha 2 da planilha
    }
  }
  return -1;
}

function proximoId(aba) {
  let ultimaLinha = aba.getLastRow();
  if (ultimaLinha <= 1) return 1;
  let idsExistentes = aba.getRange(2, 1, ultimaLinha - 1, 1).getValues();
  let ultimoId = Math.max(...idsExistentes.map(row => Number(row[0]) || 0));
  return ultimoId + 1;
}

// incluirInativos = true retorna tudo (uso da área de gerenciamento);
// false/omitido retorna só os ativos (uso público do site)
function getDadosAba(ss, nomeAba, incluirInativos) {
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) return [];

  const data = aba.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    let obj = {};
    let temDados = false;

    for (let j = 0; j < headers.length; j++) {
      let cabecalho = headers[j];
      let valor = row[j];

      if (valor instanceof Date) {
        let dia = String(valor.getDate()).padStart(2, '0');
        let mes = String(valor.getMonth() + 1).padStart(2, '0');
        let ano = valor.getFullYear();
        valor = `${dia}/${mes}/${ano}`;
      }

      if (cabecalho !== 'ativo' && valor !== '' && valor !== null && valor !== false) {
        temDados = true;
      }
      obj[cabecalho] = valor;
    }

    if (!temDados) continue; // pula linhas vazias (só com checkbox)

    let estaAtivo = obj['ativo'] === true || obj['ativo'] === 'VERDADEIRO' || obj['ativo'] === 'true';
    if (incluirInativos || estaAtivo) {
      obj['ativo'] = estaAtivo;
      result.push(obj);
    }
  }

  return result;
}
