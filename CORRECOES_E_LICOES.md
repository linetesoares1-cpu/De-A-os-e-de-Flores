# Correções e Lições — De Aços e de Flores

Registro didático dos problemas encontrados no projeto e como foram resolvidos. O objetivo é você (dono do projeto) entender o que aconteceu e evitar repetir — não é um log técnico para máquina.

---

## 1. Editar um conteúdo oculto publicava ele de novo sem querer

**O que era:** no painel de gerenciamento, se você ocultava uma frase/vídeo e depois só corrigia um errinho de digitação (sem mexer no botão "Ocultar/Publicar"), o site voltava a mostrar ela — mesmo você não tendo pedido isso.

**Sintoma:** conteúdo que devia continuar escondido reaparecia no site depois de uma edição de texto.

**Causa:** a função que salva a edição (`salvarConteudo`, em `Código.gs`) sempre marcava o conteúdo como "ativo = verdadeiro" quando o formulário de edição não enviava esse campo — e o formulário de edição realmente não envia, porque ele só edita o texto.

**Correção:** agora, se a edição não disser explicitamente se o conteúdo deve ficar visível ou oculto, o sistema **mantém o que já estava salvo** na planilha. Só muda o "visível/oculto" quando você clica de propósito no botão correspondente. (`Código.gs`, função `salvarConteudo`.)

**Como evitar no futuro:** sempre que uma função "atualiza" um registro, pergunte: "se o formulário não mandar esse campo, o valor antigo é preservado ou apagado?" Editar deveria trocar só o que a pessoa realmente mexeu.

---

## 2. Data de cadastro aparecia como texto estranho ("1990-05-15T04:00...")

**O que era:** a coluna "quando a pessoa se cadastrou" às vezes mostrava um texto cheio de letras e números em vez de uma data normal (dia/mês/ano).

**Sintoma:** no painel de gerenciamento, a coluna de data ficava ilegível para quem não é técnico.

**Causa:** o Google Sheets guarda datas internamente como um tipo especial ("Date"). O código verificava isso com `valor instanceof Date`, mas essa checagem falhava dependendo de como o valor chegava — então a data passava direto sem ser formatada.

**Correção:** a checagem agora é mais robusta (verifica se o valor "se comporta como data", não só se é tecnicamente um objeto Date) e formata sempre como `dd/mm/aaaa` (ou `dd/mm/aaaa hh:mm` quando tem hora, como no caso da data de cadastro). (`Código.gs`, função `getDadosAba`.)

**Como evitar no futuro:** ao lidar com datas vindas de planilha, sempre formatar explicitamente no backend antes de mandar pro site — nunca confiar que o Google já manda formatado do jeito certo.

---

## 3. Uma frase da planilha ficou com o "id" em branco (só espaço)

**O que era:** a frase da Clarice Lispector (a primeira da aba Conteúdos) estava com a coluna `id` contendo um espaço em branco em vez do número `1`.

**Sintoma:** não dava pra perceber olhando o site (a frase aparecia normal), mas se alguém tentasse **editar ou ocultar** essa frase pelo painel, provavelmente falharia silenciosamente — o sistema procura o registro pelo número do id, e "espaço em branco" não bate com nenhum id.

**Causa provável:** resquício de uma limpeza manual anterior na planilha (uma célula foi esvaziada digitando um espaço, em vez de apagada corretamente).

**Correção:** o id foi corrigido de volta para `1` diretamente na planilha.

**Como evitar no futuro:** para "limpar" uma célula, usar Delete/Backspace de verdade (célula fica realmente vazia), nunca digitar um espaço — um espaço "parece" vazio mas não é, e confunde comparações no código.

---

## 4. Sobrou dado de teste na planilha (linha "TESTE-E2E-Playwright" e "TESTE-E2E-CONTEUDO")

**O que era:** durante os testes de outra sessão, ficaram esquecidas na planilha real uma participante de teste ("TESTE-E2E-Playwright") e um conteúdo de teste ("TESTE-E2E-CONTEUDO editado de novo sem mexer no ativo").

**Sintoma:** nenhum — só "sujeira" nos dados reais da comunidade, que apareceria pra equipe ao abrir a planilha.

**Causa:** a sessão anterior foi interrompida (computador desligado) antes de rodar a limpeza dos testes.

**Correção:** as duas linhas de teste foram removidas da planilha nesta vistoria.

**Como evitar no futuro:** sempre marcar dado de teste com um prefixo bem visível (ex.: `TESTE-E2E-...`) — foi assim que deu pra achar e limpar com segurança sem mexer em dados reais de colegas.

---

## 5. Pendência (não corrigida agora): grade da aba Conteúdos com ~1000 linhas extras

**O que é:** a aba `Conteúdos` da planilha tem uma grade de 1000+ linhas, mas só as 3-4 primeiras têm dado de verdade. As demais só têm um checkbox pré-criado (sem nenhum outro dado) na coluna `ativo` — resquício de quando a aba foi criada.

**Por que incomoda:** quando alguém cria um conteúdo novo pelo painel, o sistema adiciona a linha **depois da última linha que tem qualquer coisa preenchida** — e um checkbox "desmarcado" conta como preenchido. Resultado: o conteúdo novo pode cair lá embaixo, na linha ~1006, longe da vista de quem abre a planilha.

**Isso é um bug que quebra o site?** Não. O backend já ignora essas linhas vazias na hora de montar a lista para o site (função `getDadosAba`), então tudo continua funcionando certinho — é só uma questão de organização visual da planilha. A aba `Participantes` já teve exatamente esse problema e já foi corrigida (hoje ela tem só as linhas realmente usadas).

**Por que não foi corrigido agora:** a correção envolve apagar de uma vez ~1000 linhas da planilha real da equipe, e o sistema de segurança do assistente bloqueou essa ação em lote por segurança (mudança grande demais para fazer sem confirmação direta de quem manda no projeto). Ficou pendente para não arriscar mexer demais na planilha sem autorização explícita.

**Como resolver quando quiser:** peça para a equipe técnica "aparar a grade da aba Conteúdos, do jeito que já foi feito com a Participantes" — é uma operação segura (só remove linhas vazias), leva menos de um minuto.

---

## 6. Arquivo `Código.gs` do repositório estava desatualizado

**O que era:** as correções 1 e 2 acima já tinham sido feitas e publicadas no backend de verdade (versão 12), mas o arquivo `Código.gs` guardado no GitHub (que serve só de cópia de referência, não afeta o site) ainda estava na versão antiga.

**Sintoma:** nenhum no site — mas quem olhasse o código no GitHub veria uma versão desatualizada e poderia se confundir.

**Correção:** o arquivo foi sincronizado com o backend real e enviado (`git push`) para o repositório.

**Como evitar no futuro:** sempre que o backend for atualizado via `clasp push`, copiar o mesmo arquivo para dentro do repositório e fazer commit — os dois devem andar juntos.

---

*Vistoria realizada em 20/08/2026. Testes feitos direto na URL pública do backend (cadastro, edição de conteúdo, ocultar/publicar, desativar/reativar participante) — todos os dados de teste foram removidos da planilha ao final.*
