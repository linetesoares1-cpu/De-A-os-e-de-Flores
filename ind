// ID da sua planilha
const SPREADSHEET_ID = '1V2njaZXlwX3EAhmYReHrmk3I90XeL1OPSXS7oPlZY7U';

function doGet(e) {
  let action = e ? e.parameter.action : 'getAll';
  let result = {};

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (action === 'getAll' || !action) {
      result = {
        status: 'success',
        participantes: getDadosAba(ss, 'Participantes'),
        conteudos: getDadosAba(ss, 'Conteúdos')
      };
    } else if (action === 'getParticipantes') {
      result = { status: 'success', data: getDadosAba(ss, 'Participantes') };
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

// Função responsável por receber os dados do formulário enviado pelo site via POST
function doPost(e) {
  try {
    let dados = JSON.parse(e.postData.contents);
    
    if (dados.action === 'cadastrarParticipante') {
      let resultadoSalvar = salvarParticipante(dados.payload);
      return ContentService.createTextOutput(JSON.stringify(resultadoSalvar))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Ação POST desconhecida.' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function salvarParticipante(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const aba = ss.getSheetByName('Participantes');
  
  if (!aba) {
    return { status: 'error', message: 'Aba Participantes não encontrada.' };
  }

  // Pega a última linha para gerar um ID sequencial automático
  let ultimaLinha = aba.getLastRow();
  let novoId = 1;
  
  if (ultimaLinha > 1) {
    let idsExistentes = aba.getRange(2, 1, ultimaLinha - 1, 1).getValues();
    let ultimoId = Math.max(...idsExistentes.map(row => Number(row[0]) || 0));
    novoId = ultimoId + 1;
  }

  let dataAtual = new Date();

  // Ordem exata das colunas da aba Participantes:
  // [id, data_cadastro, login_contato, nome, faixa_etaria, localidade, genero, estado_civil, objetivo_site, sonhos_objetivos_vida, ativo]
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
    true // ativo por padrão
  ];

  aba.appendRow(novaLinha);

  return { 
    status: 'success', 
    message: 'Participante cadastrada com sucesso!',
    id: novoId 
  };
}

function getDadosAba(ss, nomeAba) {
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
    
    for (let j = 0; j < headers.length; j++) {
      let cabecalho = headers[j];
      let valor = row[j];
      
      if (valor instanceof Date) {
        let dia = String(valor.getDate()).padStart(2, '0');
        let mes = String(valor.getMonth() + 1).padStart(2, '0');
        let ano = valor.getFullYear();
        valor = `${dia}/${mes}/${ano}`;
      }
      
      obj[cabecalho] = valor;
    }
    
    if (obj['ativo'] === true || obj['ativo'] === 'VERDADEIRO' || obj['ativo'] === 'true') {
      result.push(obj);
    }
  }
  
  return result;
}
