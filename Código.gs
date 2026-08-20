const SPREADSHEET_ID = '1V2njaZXlwX3EAhmYReHrmk3I90XeL1OPSXS7oPlZY7U';

// Chave de acesso da área de gerenciamento.
// Para trocar: no editor do Apps Script, Configurações do projeto > Propriedades do script,
// crie a propriedade CHAVE_ADMIN com a nova chave. Ela vale na hora, sem mexer no código.
function getChaveAdmin() {
  return PropertiesService.getScriptProperties().getProperty('CHAVE_ADMIN') || 'acoseflores2026';
}

// Client ID do Google (Login com Google) — configurado em Propriedades do script.
// Sem essa propriedade, o mural fica desligado (login e ações retornam erro claro).
function getGoogleClientId() {
  return PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '';
}

// Confere o "crachá" (ID token) que o Google Identity Services devolve no navegador.
// Consulta o próprio Google (tokeninfo) para validar assinatura/expiração e confirma
// que o token foi emitido para o nosso Client ID (campo "aud").
function validarTokenGoogle(idToken) {
  if (!idToken) {
    return { valido: false, erro: 'Faça login para ver o mural.' };
  }
  const clientId = getGoogleClientId();
  if (!clientId) {
    return { valido: false, erro: 'Login com Google ainda não está configurado.' };
  }
  try {
    const resposta = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
      { muteHttpExceptions: true }
    );
    if (resposta.getResponseCode() !== 200) {
      return { valido: false, erro: 'Faça login para ver o mural.' };
    }
    const info = JSON.parse(resposta.getContentText());
    if (info.aud !== clientId) {
      return { valido: false, erro: 'Faça login para ver o mural.' };
    }
    return {
      valido: true,
      email: info.email || '',
      nome: info.name || info.email || 'Uma flor da comunidade'
    };
  } catch (erro) {
    return { valido: false, erro: 'Faça login para ver o mural.' };
  }
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

    // ---- Mural privado (exige crachá do login Google, não a chave da equipe) ----
    if (dados.action === 'muralListar') {
      return responderJson(muralListar(dados.id_token));
    }
    if (dados.action === 'muralPostar') {
      return responderJson(muralPostar(dados.id_token, dados.payload));
    }

    // ---- Ações administrativas (exigem a chave de acesso) ----
    const acoesAdmin = ['adminListarConteudos', 'adminSalvarConteudo', 'adminAlternarAtivo', 'adminListarParticipantes', 'adminListarMural'];
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
      if (dados.action === 'adminListarMural') {
        return responderJson({ status: 'success', data: getDadosAba(ss, 'Mural', true) });
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
    // Se o payload não trouxer "ativo" explicitamente (ex.: o formulário de edição
    // não envia esse campo), mantém o valor que já estava salvo — senão, editar um
    // conteúdo oculto o publicava de novo sem querer.
    let ativoAtual = aba.getRange(linha, 6).getValue();
    let ativoAtualBool = ativoAtual === true || ativoAtual === 'VERDADEIRO' || ativoAtual === 'true';
    let novoAtivo = (typeof payload.ativo === 'boolean') ? payload.ativo : ativoAtualBool;
    aba.getRange(linha, 2, 1, 5).setValues([[
      payload.tipo_conteudo || '',
      payload.texto_conteudo || '',
      payload.autor || '',
      payload.video_url || '',
      novoAtivo
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

// Lista os posts do mural para quem já está logada: só campos públicos.
// O e-mail da autora NUNCA vai para outras participantes, só para a moderação (com chave).
function muralListar(idToken) {
  const v = validarTokenGoogle(idToken);
  if (!v.valido) {
    return { status: 'error', message: v.erro };
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const posts = getDadosAba(ss, 'Mural').map(function (p) {
    return { id: p.id, data_post: p.data_post, nome: p.nome, texto: p.texto };
  });
  posts.sort(function (a, b) { return Number(b.id) - Number(a.id); }); // mais recente primeiro
  return { status: 'success', data: posts };
}

// Publica uma mensagem no mural. Nome e e-mail vêm do crachá do Google (não do formulário),
// então ninguém consegue postar em nome de outra pessoa.
function muralPostar(idToken, payload) {
  const v = validarTokenGoogle(idToken);
  if (!v.valido) {
    return { status: 'error', message: v.erro };
  }
  const texto = (payload && payload.texto ? String(payload.texto) : '').trim();
  if (!texto) {
    return { status: 'error', message: 'Escreva algo antes de publicar.' };
  }
  if (texto.length > 2000) {
    return { status: 'error', message: 'O texto pode ter no máximo 2000 caracteres.' };
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const aba = ss.getSheetByName('Mural');
  if (!aba) {
    return { status: 'error', message: 'Aba Mural não encontrada.' };
  }
  const novoId = proximoId(aba);
  aba.appendRow([novoId, new Date(), v.email, v.nome, texto, true]);
  return { status: 'success', message: 'Publicado com sucesso!', id: novoId };
}

// Liga/desliga a coluna "ativo" de um registro (Conteúdos, Participantes ou Mural)
function alternarAtivo(ss, payload) {
  const abasPermitidas = ['Conteúdos', 'Participantes', 'Mural'];
  const nomeAba = abasPermitidas.indexOf(payload.aba) !== -1 ? payload.aba : 'Conteúdos';
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

      // Checagem robusta de data: "instanceof Date" pode falhar dependendo de como
      // o valor chega do Sheets, então detectamos por "tem getFullYear() e é uma data válida".
      let ehData = valor && typeof valor.getFullYear === 'function' && !isNaN(valor.getTime && valor.getTime());
      if (ehData) {
        let dia = String(valor.getDate()).padStart(2, '0');
        let mes = String(valor.getMonth() + 1).padStart(2, '0');
        let ano = valor.getFullYear();
        let horas = valor.getHours();
        let minutos = valor.getMinutes();
        // Se tiver hora diferente de 00:00, mantém junto (ex.: data_cadastro grava data+hora)
        valor = (horas === 0 && minutos === 0)
          ? `${dia}/${mes}/${ano}`
          : `${dia}/${mes}/${ano} ${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
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
