// ============================================================
// VERCEL FUNCTION — Captura de Lead da Aula 1
// ============================================================
// Endpoint: POST /api/capturar-aula1
// Recebe: { name, email, phone, origem? }
// Faz: salva no Airtable + envia email via Resend
// ============================================================

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Leads Aula 1';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Curso Grupo Dicas <cursos@grupodicas.com>';
const AULA_VIMEO_URL = process.env.AULA_VIMEO_URL || ''; // Substituir quando aula estiver no ar

// Rate limiting simples em memória (zera a cada deploy)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 5; // máximo 5 cadastros por IP por minuto

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  return record.count <= RATE_LIMIT_MAX;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(str) {
  return String(str || '').trim().slice(0, 200);
}

// Verifica se email já existe no Airtable
async function emailJaCadastrado(email) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(`{Email}='${email}'`)}&maxRecords=1`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.records && data.records.length > 0;
  } catch (err) {
    console.error('Erro ao verificar duplicidade:', err);
    return false; // Em caso de erro, deixa cadastrar
  }
}

// Salva lead no Airtable
async function salvarNoAirtable(dados) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: [{
        fields: {
          'Nome': dados.name,
          'Email': dados.email,
          'Telefone': dados.phone,
          'Origem': dados.origem || 'organico',
          'Status': 'Novo'
        }
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable: ${error}`);
  }

  return await response.json();
}

// Template HTML do email
function gerarEmailHTML(nome) {
  const aulaLink = AULA_VIMEO_URL || 'https://aula1.grupodicas.com/obrigado';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sua aula está liberada</title>
</head>
<body style="margin:0;padding:0;background:#f5f3f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1a1226;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f9;padding:40px 20px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(91,47,146,0.08);">

        <!-- Header com gradiente -->
        <tr>
          <td style="background:linear-gradient(135deg,#E91E8C,#5B2F92);padding:40px 30px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
              🎁 Sua aula está liberada!
            </h1>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:36px 30px;">
            <p style="font-size:16px;line-height:1.6;color:#1a1226;margin:0 0 20px 0;">
              Olá, <strong>${nome.split(' ')[0]}</strong>! 👋
            </p>

            <p style="font-size:16px;line-height:1.6;color:#1a1226;margin:0 0 20px 0;">
              Obrigado por se cadastrar. Como prometido, sua aula gratuita do
              <strong>Curso Grupo Dicas</strong> está liberada.
            </p>

            <p style="font-size:16px;line-height:1.6;color:#1a1226;margin:0 0 28px 0;">
              Nessa aula eu vou te mostrar:
            </p>

            <!-- Bullets -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
              <tr><td style="padding:6px 0;font-size:15px;color:#4a3c5e;line-height:1.5;">✓ Como funciona o modelo de negócio que faturou +R$ 548 mil/mês</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;color:#4a3c5e;line-height:1.5;">✓ Por que você NÃO precisa viajar pra começar</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;color:#4a3c5e;line-height:1.5;">✓ Como funciona a curva real de crescimento</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;color:#4a3c5e;line-height:1.5;">✓ Os 3 perfis que se dão bem nesse mercado</td></tr>
            </table>

            <!-- CTA principal -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px 0;">
                  <a href="${aulaLink}"
                     style="display:inline-block;background:linear-gradient(135deg,#E91E8C,#5B2F92);color:white;text-decoration:none;padding:18px 36px;border-radius:999px;font-weight:800;font-size:16px;box-shadow:0 12px 28px rgba(233,30,140,0.35);">
                    ▶ Assistir aula agora
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:14px;line-height:1.6;color:#847593;margin:0 0 8px 0;text-align:center;">
              Ou copie e cole este link no seu navegador:<br/>
              <a href="${aulaLink}" style="color:#E91E8C;word-break:break-all;">${aulaLink}</a>
            </p>
          </td>
        </tr>

        <!-- Divisor -->
        <tr>
          <td style="padding:0 30px;">
            <hr style="border:0;height:1px;background:#ece8f3;margin:0;"/>
          </td>
        </tr>

        <!-- Assinatura -->
        <tr>
          <td style="padding:30px;">
            <p style="font-size:15px;line-height:1.6;color:#4a3c5e;margin:0 0 14px 0;">
              Tira 30 minutos do seu dia pra assistir com calma. Tem informação valiosa que você
              não vai encontrar em vídeo nenhum aberto na internet.
            </p>
            <p style="font-size:15px;line-height:1.6;color:#4a3c5e;margin:0 0 14px 0;">
              Qualquer dúvida, é só responder esse email.
            </p>
            <p style="font-size:15px;line-height:1.6;color:#4a3c5e;margin:0;">
              Te vejo lá!<br/>
              <strong style="color:#1a1226;">Gabriel Lorenzi</strong><br/>
              <span style="color:#847593;font-size:13px;">Fundador do Grupo Dicas</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafafe;padding:24px 30px;text-align:center;">
            <p style="font-size:12px;color:#847593;line-height:1.5;margin:0 0 8px 0;">
              Você está recebendo esse email porque se cadastrou em
              <a href="https://aula1.grupodicas.com" style="color:#E91E8C;text-decoration:none;">aula1.grupodicas.com</a>
            </p>
            <p style="font-size:12px;color:#847593;line-height:1.5;margin:0;">
              © 2026 Curso Grupo Dicas · São Paulo · Orlando
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
  `.trim();
}

// Envia email via Resend
async function enviarEmail(nome, email) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: `🎁 ${nome.split(' ')[0]}, aqui está sua aula gratuita do Curso Grupo Dicas`,
      html: gerarEmailHTML(nome),
      reply_to: 'cursos@grupodicas.com'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend: ${error}`);
  }

  return await response.json();
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  // CORS — permite chamadas do próprio domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde um minuto.' });
    }

    // Honeypot anti-spam (campo invisível que humanos não preenchem)
    if (req.body.website || req.body.url) {
      return res.status(200).json({ success: true }); // finge sucesso pra bot
    }

    // Validação
    const name = sanitize(req.body.name);
    const email = sanitize(req.body.email).toLowerCase();
    const phone = sanitize(req.body.phone);
    const origem = sanitize(req.body.origem) || 'organico';

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Nome inválido' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Telefone inválido' });
    }

    // Verifica duplicidade
    const jaExiste = await emailJaCadastrado(email);
    if (jaExiste) {
      // Reenvia email mesmo assim (pessoa pode ter perdido)
      try {
        await enviarEmail(name, email);
      } catch (err) {
        console.error('Erro ao reenviar email:', err);
      }
      return res.status(200).json({
        success: true,
        message: 'Email reenviado',
        duplicate: true
      });
    }

    // Salva no Airtable
    await salvarNoAirtable({ name, email, phone, origem });

    // Envia email
    await enviarEmail(name, email);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro na captura:', error);
    return res.status(500).json({
      error: 'Erro interno. Tente novamente em alguns instantes.'
    });
  }
}
