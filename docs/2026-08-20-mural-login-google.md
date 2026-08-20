# Especificação — Mural privado com login Google

Data: 2026-08-20 · Decidido com Luciano (e Linete): mural privado, posts sempre com nome, tecnologia planilha + Apps Script.

## Objetivo
Mulheres da comunidade entram com a conta Google delas (sem senha nova) e ganham acesso a um mural privado onde compartilham casos reais. Quem não está logada não lê nada do mural. A Linete modera pelo painel de gerenciamento.

## Login (Google Identity Services)
- Botão oficial "Entrar com o Google" em `comunidade.html` (script `https://accounts.google.com/gsi/client`).
- O Google devolve um crachá digital (ID token JWT). O site guarda em `sessionStorage` e envia em cada chamada do mural.
- O backend confere o crachá em `https://oauth2.googleapis.com/tokeninfo?id_token=...` e valida que `aud` = nosso Client ID (propriedade de script `GOOGLE_CLIENT_ID`). Extrai e-mail e nome.
- Crachá expira em ~1h → o site volta a mostrar o botão de login.
- Client ID criado manualmente pelo Luciano no Google Cloud Console (credencial gratuita; origem autorizada: `https://linetesoares1-cpu.github.io`). Até ser configurado, a página mostra "login em configuração" e o backend recusa as ações do mural.

## Dados — aba nova `Mural` na planilha
Colunas (linha 1): `id`, `data_post`, `email`, `nome`, `texto`, `ativo`.
Sem checkboxes pré-criados em linhas vazias (lição da aba Participantes).

## Backend (Código.gs) — ações novas no doPost
- `muralListar` `{id_token}` → token válido? lista posts ativos, só campos públicos: id, data_post, nome, texto (e-mail NÃO vai para as participantes). Token inválido/ausente → erro "Faça login para ver o mural."
- `muralPostar` `{id_token, payload:{texto}}` → token válido? valida texto (obrigatório, até 2000 caracteres) → grava id sequencial, data, e-mail, nome (do token, não do formulário), ativo=true.
- Admin (com `chave`, padrão existente): `adminListarMural` → tudo, inclusive ocultos e e-mails; `adminAlternarAtivo` passa a aceitar `aba:'Mural'` (whitelist).
- Nada muda nas ações existentes.

## Frontend
- `comunidade.html`: seção Mural. Deslogada → jardim atual + convite + botão Google (ou aviso de configuração). Logada → lista de posts (nome, data, texto) + caixa "Compartilhe com a comunidade" + botão Sair (limpa o token).
- `gerenciar.html`: terceira aba "Mural" no painel — lista completa (com e-mail) e botões Ocultar/Publicar.
- Identidade visual do site (roxo/prata, Cinzel/Montserrat, fa-spa).

## Segurança e privacidade
- Leitura e escrita do mural só com token Google válido (verificado no servidor, não só na tela).
- E-mails das autoras nunca saem para membros; só para a moderação (com chave).
- Moderação nunca apaga: oculta (ativo=false), reversível.
- Escape de HTML em tudo que vem de usuário antes de renderizar (padrão já usado no painel).

## Fora de escopo desta versão (registrado)
- Aprovação prévia de quem entra (qualquer conta Google entra).
- Posts anônimos, respostas/comentários entre posts, notificações.
- Salas de conversa ao vivo nos Círculos.

## Critérios de aceite
1. Sem login, `muralListar`/`muralPostar` retornam erro e a página não exibe posts.
2. Com login válido, mulher vê posts e publica; o post aparece na planilha com e-mail/nome do Google.
3. Post ocultado pela Linete some do mural e continua no painel.
4. Ações antigas (cadastro, conteúdos, painel) continuam funcionando.
