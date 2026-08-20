# 🌷 Manual de Gerenciamento — De Aços e de Flores

Este manual explica, em linguagem simples, como cuidar do site da comunidade: publicar conteúdos, gerenciar participantes e resolver problemas comuns. Foi feito para a equipe do projeto — não é preciso saber programar.

---

## 📍 Endereços importantes

| O que é | Endereço |
|---|---|
| Site (página inicial) | https://linetesoares1-cpu.github.io/De-A-os-e-de-Flores/ |
| Formulário de cadastro | https://linetesoares1-cpu.github.io/De-A-os-e-de-Flores/cadastro.html |
| **Área de gerenciamento** | https://linetesoares1-cpu.github.io/De-A-os-e-de-Flores/gerenciar.html |
| Planilha (banco de dados) | [Planilha no Google Sheets](https://docs.google.com/spreadsheets/d/1V2njaZXlwX3EAhmYReHrmk3I90XeL1OPSXS7oPlZY7U/edit) |
| Código no GitHub | https://github.com/linetesoares1-cpu/De-A-os-e-de-Flores |

---

## 🔑 Entrando na área de gerenciamento

1. Abra a página **gerenciar.html** (link na tabela acima).
2. Digite a **chave de acesso da equipe** e clique em **Entrar**.
3. Pronto! O painel abre com três abas: **Conteúdos**, **Participantes** e **Mural**.
4. Ao terminar, clique em **Sair** (canto superior direito do painel).

> ⚠️ A chave é da equipe — não compartilhe com pessoas de fora. Se suspeitar que vazou, troque a chave (veja no final do manual).

---

## 🍃 Aba Conteúdos — frases, vídeos e mensagens

É aqui que você alimenta o site com conteúdo.

### Criar um conteúdo novo
1. No formulário **"Novo conteúdo"**, escolha o **Tipo**:
   - **Frase** — frases inspiradoras exibidas no site;
   - **Video** — indicação de vídeo (preencha também o link);
   - **Resposta Chatbot** — mensagens de acolhimento do futuro chatbot.
2. Preencha o **Texto** (obrigatório) e a **Autoria** (ex.: "Clarice Lispector", "Equipe Aços e Flores").
3. Se for vídeo, cole o **link do vídeo** (ex.: link do YouTube).
4. Clique em **Salvar conteúdo**. Ele já entra na planilha e fica "No ar".

### Editar um conteúdo
1. Na lista **"Conteúdos cadastrados"**, clique em **✏️ Editar** na linha desejada.
2. O formulário lá em cima carrega o conteúdo. Altere o que quiser.
3. Clique em **Salvar conteúdo** (ou **Cancelar edição** para desistir).

### Tirar do ar / colocar de volta
- **👁️‍🗨️ Ocultar**: o conteúdo continua guardado na planilha, mas **some do site**.
- **👁️ Publicar**: coloca de volta no ar um conteúdo oculto.
- Nada é apagado — você sempre pode reverter.

---

## 👥 Aba Participantes

Mostra todas as mulheres cadastradas pelo site, com nome, contato, localidade e data de cadastro.

- **Desativar**: use se um cadastro for de teste, duplicado ou indevido. A pessoa some das listagens do site, mas os dados ficam guardados.
- **Reativar**: desfaz a desativação.

> 🔒 **Privacidade**: os dados completos das participantes (contato, respostas pessoais) só aparecem aqui na área de gerenciamento, com chave. O site público não expõe essas informações.

---

## 💬 Aba Mural

Mostra todas as mensagens que as mulheres logadas publicaram no mural privado (comunidade.html), incluindo o e-mail de quem postou (que nunca aparece para as outras participantes — só aqui, com chave).

- **Ocultar**: some do mural que as participantes veem, mas continua guardado.
- **Publicar**: coloca de volta uma mensagem que estava oculta.

> ⚠️ O mural só funciona depois que o **Client ID do Google** for configurado (ver `ESPECIFICACAO.md`, seção "Roadmap"). Até lá, ninguém consegue logar nem postar, então esta aba deve aparecer vazia.

---

## 📊 A planilha (nosso banco de dados)

A planilha do Google Sheets guarda tudo em três abas:

- **Participantes** — colunas: id, data_cadastro, login_contato, nome, faixa_etaria, localidade, genero, estado_civil, objetivo_site, sonhos_objetivos_vida, ativo
- **Conteúdos** — colunas: id, tipo_conteudo, texto_conteudo, autor, video_url, ativo
- **Mural** — colunas: id, data_post, email, nome, texto, ativo

**Regras de ouro:**
1. ❌ **Não renomeie** as abas nem os títulos das colunas (linha 1) — o site depende desses nomes exatos.
2. ❌ **Evite apagar linhas** — o painel de gerenciamento não apaga nada de propósito (só oculta). Se precisar mesmo excluir algo, faça na planilha com muito cuidado.
3. ✅ Prefira sempre usar a **área de gerenciamento** em vez de editar a planilha na mão.
4. A coluna **ativo** é o "interruptor": marcada = aparece no site; desmarcada = fica oculto.

---

## 🚀 Como o site é publicado

- O site fica hospedado no **GitHub Pages**: tudo que entra no repositório (branch `main`) vai ao ar automaticamente em 1–2 minutos.
- O **backend** (a ponte entre o site e a planilha) é um projeto **Google Apps Script**. O arquivo `Código.gs` deste repositório é uma cópia dele para referência — alterar o arquivo aqui **não** muda o backend; a atualização é feita no Apps Script (a equipe técnica cuida disso com o `clasp`).

---

## 🔧 Problemas comuns

**"Chave de acesso inválida" ao entrar no painel**
→ Confira a chave com a equipe (maiúsculas/minúsculas contam). Clique em Sair e tente de novo.

**"Não foi possível conectar" ou erro 403 em tudo**
→ O backend precisa ser reautorizado. Quem tem acesso ao Apps Script deve abrir o projeto, clicar em **Implantar → Gerenciar implantações → ✏️ → Versão: "Nova versão" → Implantar** e, se aparecer, autorizar as permissões da conta Google.

**Cadastro novo não aparece no painel**
→ Clique em **Recarregar** na lista. Os cadastros entram na planilha na hora.

**Quero trocar a chave de acesso**
→ No editor do Apps Script: ⚙️ **Configurações do projeto → Propriedades do script → Adicionar propriedade**: nome `CHAVE_ADMIN`, valor = a nova chave. Vale na hora, sem mexer em código.

---

*Manual criado em agosto de 2026 pela equipe técnica (Claude) do projeto De Aços e de Flores.*
