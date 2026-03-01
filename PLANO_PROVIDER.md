# PLANO_PROVIDER.md — WhatsApp Gateway Service

Serviço standalone que abstrai múltiplos providers de WhatsApp (Evolution API, Z-API, SendPulse)
e expõe uma API REST unificada para ser consumida por qualquer projeto.

---

## Contexto para o Desenvolvedor

- Projeto standalone — não é monorepo, não compartilha código com outros projetos
- **Infraestrutura: 100% Railway** — PostgreSQL via Railway, deploy do serviço via Railway (sem VPS, sem Nginx)
- A `DATABASE_URL` vem automaticamente da variável de ambiente do Railway ao linkar o banco
- Railway detecta NestJS via Nixpacks — não é necessário Dockerfile customizado para deploy
- Cada projeto consumidor tem sua própria API key registrada no banco
- **Uma API key está associada a um `tenantId` fixo** — o `tenantId` NÃO precisa vir no body das mensagens, é inferido da API key
- Não usar filas (Bull, RabbitMQ) na Fase 1 — manter simples
- Não usar cache Redis na Fase 1
- Webhook retry: usar axios com 3 tentativas e delay de 1s entre elas — sem fila de mensagens
- Testes: apenas e2e básico na Fase 1, sem unit tests
- Criptografia dos `config` no banco: usar módulo `crypto` nativo do Node com AES-256-CBC e a variável `ENCRYPTION_KEY`

---

## Visão Geral

```
zaproutev2 ─┐
outro-app   ─┤──► POST /messages/text  ──► whatsapp-gateway ──► Evolution API ──► WhatsApp
outro-app-2 ─┘                                                └► Z-API
                                                              └► SendPulse
```

**Por que um serviço separado?**
- Centraliza credenciais de WhatsApp em um único lugar
- Qualquer projeto consome via REST com API key
- Troca de provider sem tocar nos projetos consumidores
- Normaliza webhooks de diferentes providers em formato único
- Deploy independente (escala sem afetar os outros projetos)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | NestJS + TypeScript |
| Banco | PostgreSQL + Prisma (configs de tenants) |
| Auth | API Keys por projeto consumidor |
| HTTP Client | Axios |
| Deploy | Railway (Nixpacks — sem Dockerfile necessário) |
| Docs | Swagger (OpenAPI) automático via NestJS |

---

## Estrutura do Projeto

```
whatsapp-gateway/
├── src/
│   ├── auth/                        # Validação de API keys
│   │   ├── auth.guard.ts
│   │   └── auth.module.ts
│   │
│   ├── tenants/                     # Configuração de providers por tenant
│   │   ├── tenants.controller.ts
│   │   ├── tenants.service.ts
│   │   ├── tenants.module.ts
│   │   └── dto/
│   │       ├── create-tenant.dto.ts
│   │       └── update-tenant.dto.ts
│   │
│   ├── messages/                    # Envio de mensagens
│   │   ├── messages.controller.ts
│   │   ├── messages.service.ts
│   │   ├── messages.module.ts
│   │   └── dto/
│   │       ├── send-text.dto.ts
│   │       ├── send-image.dto.ts
│   │       ├── send-audio.dto.ts
│   │       ├── send-location.dto.ts
│   │       ├── send-template.dto.ts
│   │       └── send-buttons.dto.ts
│   │
│   ├── providers/                   # Implementações dos providers
│   │   ├── provider.interface.ts    # Contrato comum
│   │   ├── evolution/
│   │   │   └── evolution.provider.ts
│   │   ├── zapi/
│   │   │   └── zapi.provider.ts
│   │   └── sendpulse/
│   │       └── sendpulse.provider.ts
│   │
│   ├── webhooks/                    # Recebe e normaliza webhooks
│   │   ├── webhooks.controller.ts   # POST /webhooks/evolution/:tenantId
│   │   ├── webhooks.service.ts      # Normaliza + encaminha
│   │   ├── webhooks.module.ts
│   │   └── normalizers/
│   │       ├── evolution.normalizer.ts
│   │       ├── zapi.normalizer.ts
│   │       └── sendpulse.normalizer.ts
│   │
│   ├── health/
│   │   └── health.controller.ts     # GET /health
│   │
│   └── app.module.ts
│
├── prisma/
│   └── schema.prisma
│
├── railway.toml                     # Config de deploy no Railway
└── .env.example
```

---

## Modelo de Dados (Prisma)

```prisma
model ApiKey {
  id        String   @id @default(cuid())
  key       String   @unique           // ex: "wgw_abc123..."
  label     String                     // ex: "zaproutev2-prod"
  tenantId  String                     // tenant que essa key pode usar
  createdAt DateTime @default(now())
  active    Boolean  @default(true)
}

model TenantProvider {
  id            String   @id @default(cuid())
  tenantId      String   @unique
  providerType  ProviderType  // EVOLUTION | ZAPI | SENDPULSE
  webhookUrl    String?       // URL do projeto consumidor para receber eventos
  config        Json          // credenciais criptografadas
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum ProviderType {
  EVOLUTION
  ZAPI
  SENDPULSE
}
```

**Exemplo de `config` por provider:**
```json
// EVOLUTION
{ "baseUrl": "http://vps:8080", "apiKey": "xxx", "instance": "minha-instancia" }

// ZAPI
{ "instanceId": "xxx", "token": "xxx", "clientToken": "xxx" }

// SENDPULSE
{ "clientId": "xxx", "clientSecret": "xxx", "botId": "xxx" }
```

---

## API REST

### Autenticação
Todas as rotas (exceto `/health` e `/webhooks/*`) exigem header:
```
X-API-Key: wgw_abc123...
```

---

### 1. Tenants — Configurar Providers

```
POST   /tenants              → Criar config de provider para um tenant
GET    /tenants/:tenantId    → Buscar config atual
PUT    /tenants/:tenantId    → Atualizar config (trocar provider ou credenciais)
DELETE /tenants/:tenantId    → Remover config
GET    /tenants/:tenantId/status → Verificar se WhatsApp está conectado
```

---

### 2. Messages — Enviar Mensagens

Todas as rotas de mensagem recebem `tenantId` no body.

```
POST /messages/text
Body: { tenantId, phone, message }

POST /messages/image
Body: { tenantId, phone, url, caption? }

POST /messages/audio
Body: { tenantId, phone, url }

POST /messages/location
Body: { tenantId, phone, lat, lng, title?, address? }

POST /messages/template
Body: { tenantId, phone, template, variables[] }

POST /messages/buttons
Body: { tenantId, phone, text, buttons[{ id, label }] }

POST /messages/link
Body: { tenantId, phone, url, title? }
```

**Resposta padrão:**
```json
{ "success": true, "messageId": "xxx", "provider": "EVOLUTION" }
```

---

### 3. Webhooks — Receber Eventos

```
POST /webhooks/evolution/:tenantId   → Recebe webhook da Evolution API
POST /webhooks/zapi/:tenantId        → Recebe webhook do Z-API
POST /webhooks/sendpulse/:tenantId   → Recebe webhook do SendPulse
```

O serviço normaliza o payload e faz `POST` para o `webhookUrl` configurado no `TenantProvider`,
sempre no mesmo formato:

```json
{
  "event": "MESSAGE_RECEIVED" | "MESSAGE_DELIVERED" | "MESSAGE_READ" | "CONNECTION_UPDATE",
  "tenantId": "xxx",
  "phone": "5511999999999",
  "message": {
    "id": "xxx",
    "type": "text" | "image" | "audio" | "location" | "document",
    "text": "Oi",
    "mediaUrl": null,
    "timestamp": 1234567890
  },
  "raw": { ...payload original... }
}
```

---

### 4. Health

```
GET /health
→ { status: "ok", uptime: 3600, providers: ["EVOLUTION", "ZAPI"] }
```

---

## Interface do Provider

```typescript
// src/providers/provider.interface.ts
export interface WhatsappGatewayProvider {
  sendText(phone: string, message: string): Promise<{ messageId: string }>;
  sendImage(phone: string, url: string, caption?: string): Promise<{ messageId: string }>;
  sendAudio(phone: string, url: string): Promise<{ messageId: string }>;
  sendLocation(phone: string, lat: number, lng: number, title?: string, address?: string): Promise<{ messageId: string }>;
  sendTemplate(phone: string, template: string, variables: string[]): Promise<{ messageId: string }>;
  sendButtons(phone: string, text: string, buttons: { id: string; label: string }[]): Promise<{ messageId: string }>;
  sendLink(phone: string, url: string, title?: string): Promise<{ messageId: string }>;
  checkStatus(): Promise<{ connected: boolean; phone?: string }>;
}
```

---

## Evolution Provider (detalhe)

```typescript
// Endpoints base: POST http://{baseUrl}/message/{action}/{instance}
// Header: { apikey: "xxx" }

sendText    → POST /message/sendText/{instance}
             body: { number: "5511999999999", text: "Olá" }

sendImage   → POST /message/sendMedia/{instance}
             body: { number, mediatype: "image", media: url, caption }

sendAudio   → POST /message/sendMedia/{instance}
             body: { number, mediatype: "audio", media: url }

sendButtons → POST /message/sendButtons/{instance}
             body: { number, title, buttons: [{ buttonId, buttonText: { displayText } }] }

checkStatus → GET /instance/connectionState/{instance}
             response: { instance: { state: "open" | "close" | "connecting" } }
```

---

## railway.toml

Arquivo de configuração para o Railway detectar o build e start corretamente:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Variáveis de ambiente no Railway (adicionar no painel):**
- `DATABASE_URL` → gerada automaticamente ao linkar o serviço PostgreSQL do Railway
- `PORT` → Railway injeta automaticamente, mas garantir que o NestJS usa `process.env.PORT`
- `ENCRYPTION_KEY`, `MASTER_API_KEY` → adicionar manualmente

**Evolution API:**
- A Evolution API precisa rodar em servidor separado (VPS próprio ou outro serviço)
- O Railway não é ideal para hospedar Evolution API (precisa manter conexão persistente de WhatsApp Web)
- Recomendado: VPS simples (Hetzner ~€4/mês) rodando Evolution via Docker
- O gateway apenas chama os endpoints da Evolution via HTTP — é stateless

---

## .env.example

```env
# App
# PORT é injetado automaticamente pelo Railway — não definir manualmente em produção
PORT=3100
NODE_ENV=production

# Banco — Railway injeta DATABASE_URL automaticamente ao linkar o PostgreSQL
# Em desenvolvimento local, preencher manualmente
DATABASE_URL="postgresql://usuario:senha@localhost:5432/whatsapp_gateway"

# Segurança — chave para criptografar configs dos providers no banco (AES-256-CBC)
# Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="64-char-hex-string-aqui"

# API key master — usada para criar/gerenciar tenants e API keys via /tenants
MASTER_API_KEY="wgw_master_xxx"

# Evolution API — URL do servidor Evolution hospedado separadamente (ex: VPS)
EVOLUTION_BASE_URL="http://seu-vps:8080"
EVOLUTION_API_KEY="xxx"
```

---

## Ordem de Implementação

### Fase 1 — Core (MVP)
- [ ] 1.1 Setup NestJS + Prisma + PostgreSQL
- [ ] 1.2 Auth guard com API Keys
- [ ] 1.3 TenantProvider CRUD (`/tenants`)
- [ ] 1.4 Interface `WhatsappGatewayProvider`
- [ ] 1.5 EvolutionProvider (todos os métodos)
- [ ] 1.6 MessagesService (busca config do tenant, instancia provider, delega)
- [ ] 1.7 MessagesController (todas as rotas de envio)
- [ ] 1.8 Swagger/OpenAPI automático
- [ ] 1.9 railway.toml + garantir que app usa `process.env.PORT`

### Fase 2 — Webhooks
- [ ] 2.1 WebhooksController (endpoints por provider)
- [ ] 2.2 Evolution normalizer
- [ ] 2.3 Forward para webhookUrl do tenant (com retry simples)

### Fase 3 — Providers adicionais
- [ ] 3.1 ZapiProvider (migrar do zaproutev2)
- [ ] 3.2 SendPulseProvider (migrar do zaproutev2)
- [ ] 3.3 Z-API normalizer
- [ ] 3.4 SendPulse normalizer

### Fase 4 — Produção
- [ ] 4.1 Criptografia dos `config` no banco (AES-256)
- [ ] 4.2 Rate limiting por API key
- [ ] 4.3 Logs estruturados (Winston/Pino)
- [ ] 4.4 Health check com status de cada provider conectado
- [ ] 4.5 Deploy Railway: linkar PostgreSQL, configurar variáveis de ambiente, domínio customizado

---

## Integração com zaproutev2

Após o gateway estar no ar, zaproutev2 trocaria o `WhatsappService` interno por:

```typescript
// Em vez de instanciar ZapiProvider diretamente:
await this.httpService.post('https://seu-gateway.railway.app/messages/text', {
  phone: phone,
  message: message,
  // tenantId NÃO vai no body — é inferido da API key
}, {
  headers: { 'X-API-Key': process.env.GATEWAY_API_KEY }
});
```

Ou criar um `GatewayProvider` que implementa a interface atual, sem mudar nada mais no zaproutev2.

**Variáveis a adicionar no zaproutev2 (Railway):**
```env
GATEWAY_URL="https://seu-gateway.railway.app"
GATEWAY_API_KEY="wgw_zaproutev2_xxx"
```
