# Especificação — De Aços e de Flores

Site da comunidade feminina "De Aços e de Flores", feito no Curso de IA (Turma 2). Site estático (GitHub Pages) + backend Google Apps Script + planilha Google como banco de dados.

## O que o sistema faz hoje

- **`index.html`** — página inicial: apresentação da comunidade, botões para o cadastro, seções "Mural", "Círculos de Conversa" e "Reflexões" (ainda sem página própria — links `#`, ver roadmap).
- **`cadastro.html`** — formulário público. Qualquer visitante preenche nome, contato, faixa etária, localidade, gênero, estado civil, objetivo no site e sonhos/objetivos de vida. Ao enviar, grava um novo participante na planilha (aba `Participantes`) via `POST` no backend.
- **`gerenciar.html`** — painel administrativo protegido por chave (não é login de usuário — é uma senha única da equipe). Duas abas:
  - **Conteúdos**: criar, editar, ocultar/publicar frases, vídeos e mensagens de chatbot (aba `Conteúdos` da planilha).
  - **Participantes**: ver lista completa (com dados sensíveis) e desativar/reativar cadastros.
- **Backend** (Google Apps Script, arquivo `Código.gs` no repo é cópia-espelho do projeto real): expõe uma URL `/exec` com:
  - `GET ?action=getAll` — participantes públicos + conteúdos ativos.
  - `GET ?action=getParticipantes` — só `id`, `nome`, `localidade` (privacidade).
  - `GET ?action=getConteudos` — conteúdos ativos.
  - `POST {action:'cadastrarParticipante', payload}` — cadastro público, sem chave.
  - `POST {action:'adminListarConteudos'|'adminListarParticipantes'|'adminSalvarConteudo'|'adminAlternarAtivo', chave, payload}` — ações da equipe, exigem a chave certa.

## Planilha (banco de dados)

ID `1V2njaZXlwX3EAhmYReHrmk3I90XeL1OPSXS7oPlZY7U`.

- **Participantes**: id, data_cadastro, login_contato, nome, faixa_etaria, localidade, genero, estado_civil, objetivo_site, sonhos_objetivos_vida, ativo.
- **Conteúdos**: id, tipo_conteudo, texto_conteudo, autor, video_url, ativo.

`ativo` é soft delete: nada é apagado de verdade pelo painel, só fica escondido do site público.

## Privacidade / LGPD

O backend é público (`ANYONE_ANONYMOUS`, qualquer pessoa com a URL consegue chamar a API). Por isso:
- O `GET` público de participantes devolve **só** id/nome/localidade — contato e respostas pessoais só aparecem na área de gerenciamento (com chave).
- Cadastros são fictícios/de aula. Antes de usar com dados reais de pessoas de verdade em produção, o ideal seria adicionar autenticação (ex.: exigir login) antes de expor qualquer dado pessoal.

## Roadmap / pendências conhecidas

- Mural da comunidade (link `#` no index).
- Círculos de Conversa (link `#` no index).
- Página de Reflexões de Aço (link `#` no index).
- Grade da aba **Conteúdos** na planilha ainda tem ~1000 linhas extras com checkbox pré-criado na coluna `ativo` (igual o que a aba Participantes já teve e foi corrigido). Não quebra nada — o backend já ignora linhas vazias — mas um conteúdo novo criado pelo painel cai lá longe na planilha (linha ~1006) em vez de logo abaixo dos existentes. Correção é só cosmética/organizacional: aparar a grade para o tamanho real dos dados (ver `CORRECOES_E_LICOES.md`).

## Publicação

- **Site**: GitHub Pages, branch `main`, pasta raiz. Todo `git push` nessa branch publica em 1–2 min.
- **Backend**: projeto Google Apps Script vinculado à planilha (fora do GitHub). Atualizações são feitas via `clasp push` + nova versão + atualização da implantação (`clasp update-deployment`). A URL `/exec` do deployment principal não muda entre atualizações de código.
