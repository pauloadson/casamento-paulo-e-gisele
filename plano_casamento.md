# Plano de Arquitetura: App de Confirmação de Presença (RSVP)

Parabéns pelo casamento! Criar um app próprio para a confirmação de presença é uma excelente ideia e as tecnologias que você escolheu são modernas, escaláveis e possuem ótimos planos gratuitos (free tiers).

Abaixo está o detalhamento de tudo o que você vai precisar para tirar essa ideia do papel.

## 🏗️ Visão Geral da Arquitetura

1. **Frontend**: Vercel (React, Next.js ou Vite)
2. **Backend**: Render (Node.js, Python, etc.)
3. **Banco de Dados**: TiDB Cloud (MySQL compatível)
4. **Emails**: Resend

---

## 1. O que você precisa para o Banco de Dados (TiDB Cloud)
O TiDB é um banco de dados distribuído compatível com **MySQL**. Isso significa que qualquer ferramenta que se conecte ao MySQL vai funcionar perfeitamente com ele.

* **Conta no TiDB Cloud**: Crie um cluster Serverless gratuito.
* **String de Conexão**: Após criar o cluster, você precisará copiar a string de conexão (ex: `mysql://usuario:senha@host:4000/nome_do_banco`).
* **Estrutura (Tabelas)**: Uma tabela simples para os convidados.
  * `id` (UUID ou Auto Increment)
  * `nome` (String)
  * `email` (String - opcional, mas necessário para mandar o email via Resend)
  * `telefone` (String - opcional)
  * `status_confirmacao` (Booleano - Vai ou não vai)
  * `quantidade_adultos` (Inteiro)
  * `quantidade_criancas` (Inteiro)
  * `mensagem` (Texto - opcional para os noivos)

## 2. O que você precisa para o Backend (Render)
O backend será a ponte entre o seu frontend, o banco de dados e o sistema de emails. Eu recomendo **Node.js com Express** (ou Fastify/NestJS) e um ORM como o **Prisma** para facilitar a conexão com o TiDB.

* **Endpoints Principais**:
  * `POST /api/rsvp`: Para receber os dados do formulário do frontend, salvar no TiDB e acionar o Resend para enviar o email.
  * `GET /api/guests`: (Opcional) Para vocês, noivos, terem um painel administrativo e verem quem confirmou.
* **Integração com Resend**: Instalar a biblioteca oficial do Resend para enviar emails transacionais.
* **Deploy no Render**: 
  * Hospedar como um "Web Service".
  * Configurar as Variáveis de Ambiente (Environment Variables):
    * `DATABASE_URL` (Sua conexão com o TiDB)
    * `RESEND_API_KEY` (Sua chave do Resend)

## 3. O que você precisa para os Emails (Resend)
O Resend é perfeito para emails transacionais focados em desenvolvedores.

* **Domínio Próprio**: Para a melhor taxa de entrega, é ideal ter um domínio próprio (ex: `casamento-joao-maria.com`) e configurá-lo no Resend (adicionando os registros DNS). O Resend permite testar sem domínio, mas apenas para o seu próprio email de cadastro.
* **Template do Email**: Criar um template bonito em HTML (você pode usar o [React Email](https://react.email/) que é dos mesmos criadores do Resend) para dizer: *"Que alegria! Sua presença foi confirmada..."*
* **Chave de API**: Gerar uma API Key no painel do Resend para colocar no seu Backend.

## 4. O que você precisa para o Frontend (Vercel)
A Vercel brilha com **Next.js**, mas você também pode usar React puro (com Vite). 

* **Formulário Simples e Elegante**: Campos para nome, email, número de acompanhantes e se confirma ou declina.
* **Design (UI/UX)**: Sugiro algo minimalista e romântico. Podemos usar bibliotecas como TailwindCSS e Framer Motion (para animações suaves).
* **Comunicação com o Backend**: Usar `fetch` ou `axios` para enviar os dados preenchidos para a URL do seu backend no Render.
* **Deploy na Vercel**: Basta conectar o seu repositório do GitHub e a Vercel faz o deploy automático a cada nova alteração.
* **Variáveis de Ambiente**:
  * `VITE_API_URL` ou `NEXT_PUBLIC_API_URL` (A URL do seu backend no Render).

---

## 🚀 Próximos Passos (Plano de Ação)

Se você quiser, nós podemos começar a construir isso agora mesmo. Eis a ordem ideal de execução:

1. **Setup Inicial**: Criar as contas no GitHub, TiDB, Render, Vercel e Resend.
2. **Banco de Dados**: Criar o cluster no TiDB e pegar a string de conexão.
3. **Backend**: Inicializar o projeto Node.js, configurar o Prisma (com o TiDB), criar a rota e testar o disparo de emails com o Resend.
4. **Frontend**: Inicializar o projeto React/Next.js, criar a interface bonita do formulário e conectar com a API do backend.
5. **Deploy**: Colocar tudo no ar (Backend no Render e Frontend na Vercel).
