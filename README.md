# Aula 1 — Curso Grupo Dicas

Página de captura de leads pra aula gratuita do Curso Grupo Dicas.

**URL:** https://aula1.grupodicas.com

---

## Stack

- **Frontend:** HTML estático
- **Backend:** Vercel Functions (serverless)
- **Banco:** Airtable (tabela "Leads Aula 1")
- **Email:** Resend (cursos@grupodicas.com)

---

## Estrutura do projeto

```
aula1-grupo-dicas/
├── index.html              # Página de captura
├── obrigado.html           # Página de obrigado (pós-cadastro)
├── api/
│   └── capturar-aula1.js   # Endpoint que recebe lead, salva no Airtable, envia email
├── imgs/                   # Imagens da página
└── package.json
```

---

## Deploy no Vercel — passo a passo

### 1. Criar repositório no GitHub
- Crie um novo repo: `aula1-grupo-dicas`
- Suba todos esses arquivos (mantendo a estrutura)

### 2. Conectar na Vercel
- Acesse vercel.com → New Project
- Importe o repositório do GitHub
- Framework: **Other** (estático)
- Deixe os outros campos no padrão

### 3. Configurar variáveis de ambiente na Vercel
Em **Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `AIRTABLE_API_KEY` | Seu token pessoal do Airtable (começa com `pat...`) |
| `AIRTABLE_BASE_ID` | ID da base que tem a tabela (começa com `app...`) |
| `AIRTABLE_TABLE_NAME` | `Leads Aula 1` |
| `RESEND_API_KEY` | Sua API key do Resend (começa com `re_...`) |
| `RESEND_FROM_EMAIL` | `Curso Grupo Dicas <cursos@grupodicas.com>` |
| `AULA_VIMEO_URL` | URL do vídeo (deixar vazio até subir) |

### 4. Conectar domínio
- Em **Settings → Domains**, adicione `aula1.grupodicas.com`
- No Cloudflare, será criado um CNAME automaticamente
- SSL ativa em alguns minutos

### 5. Criar tabela no Airtable
Na sua base existente (mesma do projeto roteiros), criar nova tabela **"Leads Aula 1"** com os campos:

| Campo | Tipo |
|---|---|
| Nome | Single line text |
| Email | Email |
| Telefone | Phone number |
| Origem | Single select (instagram, facebook, google, youtube, tiktok, organico, outros) |
| Status | Single select (Novo, Email Enviado, Acessou Aula, Comprou, Descadastrado) |

⚠️ **Importante:** o nome da tabela deve ser EXATAMENTE "Leads Aula 1" (com espaços e maiúsculas) ou ajuste a env var `AIRTABLE_TABLE_NAME`.

### 6. Verificar email no Resend
- O domínio `grupodicas.com` já está verificado (você usa pra `roteiros@`)
- `cursos@grupodicas.com` funciona automaticamente, sem nova configuração no Resend
- **Mas:** crie a caixa real `cursos@grupodicas.com` no seu provedor (Google Workspace, Zoho etc) pra receber respostas dos clientes

---

## Testes após deploy

1. Acesse `aula1.grupodicas.com`
2. Preencha o formulário com dados reais (seu próprio email)
3. Verifique:
   - ✅ Foi redirecionado pra `/obrigado.html`
   - ✅ Recebeu email automático em poucos segundos
   - ✅ Apareceu novo registro no Airtable (tabela "Leads Aula 1")

### Se algo der errado
- Veja logs em **Vercel → Project → Logs → Real-time Logs**
- Erros comuns:
  - `Airtable: ...`: ID da base errado, nome da tabela errado, ou token sem permissão
  - `Resend: ...`: API key inválida, ou domínio não verificado
  - `429`: rate limit (5 cadastros por minuto por IP)

---

## Quando o vídeo da aula estiver pronto

1. Subir vídeo no Vimeo Pro (ou YouTube unlisted)
2. Pegar URL do player (ex: `https://player.vimeo.com/video/123456789`)
3. Atualizar variável `AULA_VIMEO_URL` na Vercel com essa URL
4. Editar `obrigado.html` e substituir o `<div class="video-placeholder">...</div>` por:
   ```html
   <iframe src="URL_DO_VIDEO" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
   ```
5. Re-deploy automático

---

## Anti-spam

- **Honeypot:** campo invisível "website" que bots preenchem (recusa cadastro)
- **Rate limit:** 5 cadastros por IP por minuto
- **Validação:** nome ≥ 2 chars, email válido, telefone ≥ 10 dígitos
- **Anti-duplicidade:** verifica se email já existe no Airtable

---

## Próximos passos sugeridos

- [ ] Criar página de obrigado real (substituir placeholder do vídeo)
- [ ] Configurar sequência de emails de nutrição (5-7 emails ao longo de 14 dias)
- [ ] Adicionar Pixel Meta + Google Analytics
- [ ] Criar segmentações no Airtable (filtros por origem, status, etc)
- [ ] Integrar webhook Kiwify → Airtable (atualizar status pra "Comprou" quando cliente compra)
