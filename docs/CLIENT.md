# Client - Documentacion

Aplicacion Next.js que implementa el sistema de agentes para analisis macroeconomico.

## Estructura

```
client/
├── app/                          # App Router (Next.js 16)
│   ├── api/
│   │   └── analysis/
│   │       └── route.ts          # Endpoint POST /api/analysis
│   ├── t/
│   │   └── [ticker]/
│   │       └── page.tsx          # Pagina dinamica por ticker
│   ├── layout.tsx                # Layout raiz
│   └── page.tsx                  # Home page
│
├── components/
│   └── charts/                   # Componentes de visualizacion
│       ├── LineChart.tsx         # Grafico de lineas
│       ├── AreaChart.tsx         # Grafico de area con gradiente
│       ├── BarChart.tsx          # Grafico de barras
│       ├── ComparativeChart.tsx  # Comparacion multi-serie
│       ├── ChartContainer.tsx    # Wrapper con controles
│       └── index.ts              # Barrel export
│
├── lib/
│   ├── agents/                   # Sistema de agentes
│   │   ├── chief/
│   │   │   └── chief.agent.ts    # Agente orquestador
│   │   └── subagents/
│   │       └── macro/
│   │           └── macro.agent.ts # MacroContextAgent
│   │
│   ├── config/
│   │   └── indicators.ts         # Series FRED configuradas
│   │
│   ├── mcp/
│   │   └── client.ts             # Cliente MCP (comunicacion con Python)
│   │
│   └── types/
│       └── macro-context.ts      # Interfaces TypeScript
│
├── .env.local                    # Variables de entorno (no commitear)
├── .env.local.example            # Plantilla de variables
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Next.js)                       │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │   UI     │───>│  API Route   │───>│    ChiefAgent       │   │
│  │ /t/AAPL  │    │ /api/analysis│    │   (orquestador)     │   │
│  └──────────┘    └──────────────┘    └─────────┬───────────┘   │
│       ▲                                        │               │
│       │                                        ▼               │
│       │                              ┌─────────────────────┐   │
│       │                              │  MacroContextAgent  │   │
│       │                              │  (OpenAI GPT-4)     │   │
│       │                              └─────────┬───────────┘   │
│       │                                        │               │
│       │                                        ▼               │
│       │                              ┌─────────────────────┐   │
│       │                              │     MCP Client      │   │
│       │                              └─────────┬───────────┘   │
└───────┼────────────────────────────────────────┼───────────────┘
        │                                        │
        │              HTTP/SSE                  │
        │              JSON-RPC                  ▼
        │                              ┌─────────────────────┐
        │                              │   Python Server     │
        │                              │   (FastMCP:8000)    │
        │                              └─────────┬───────────┘
        │                                        │
        │                                        ▼
        │                              ┌─────────────────────┐
        │                              │      FRED API       │
        └──────────────────────────────┤  (stlouisfed.org)   │
              MacroContext + Charts    └─────────────────────┘
```

## Componentes Principales

### 1. API Route (`app/api/analysis/route.ts`)

Endpoint que expone el sistema de agentes.

```typescript
POST /api/analysis
Body: { ticker?: string, scope: "macro" | "sector" | "company" | "full" }
Response: AnalysisResult
```

```typescript
GET /api/analysis
Response: { status: "ok", agents: ["macro"], ... }
```

### 2. ChiefAgent (`lib/agents/chief/chief.agent.ts`)

Orquestador que coordina sub-agentes. En MVP solo ejecuta MacroContextAgent.

```typescript
const chief = new ChiefAgent(openaiApiKey);
const result = await chief.analyze({ ticker: "AAPL", scope: "macro" });
```

**Responsabilidades:**
- Ejecutar sub-agentes en paralelo
- Agregar resultados
- Manejar errores por agente

### 3. MacroContextAgent (`lib/agents/subagents/macro/macro.agent.ts`)

Agente que analiza el contexto macroeconomico usando OpenAI con tool-calling.

**Rol:** Analista macroeconomico
**Modo:** Tool-driven
**Alcance:** Macro global (EE.UU.)

**Restricciones:**
- NO analiza sector ni empresa
- NO emite recomendaciones de inversion
- Solo usa datos de FRED

**Tools disponibles:**
- `get_fred_observations` - Obtiene datos historicos de una serie

**Output:** `MacroContext` (JSON estructurado)

### 4. MCP Client (`lib/mcp/client.ts`)

Cliente HTTP para comunicarse con el servidor Python MCP.

```typescript
import { mcpClient } from "@/lib/mcp/client";

const data = await mcpClient.getObservations("GDP", { limit: 12 });
const series = await mcpClient.searchSeries("inflation");
```

**Caracteristicas:**
- Protocolo MCP Streamable HTTP
- Soporte JSON y SSE
- Gestion automatica de sesiones

### 5. Componentes de Graficos (`components/charts/`)

| Componente | Descripcion |
|------------|-------------|
| `LineChart` | Series temporales con lineas |
| `AreaChart` | Areas con gradiente |
| `BarChart` | Barras con colores condicionales |
| `ComparativeChart` | Multiples series, ejes duales |
| `ChartContainer` | Wrapper con selector de tipo y export CSV |

Todos usan **Recharts** y son responsivos.

## Tipos Principales

### MacroContext

```typescript
interface MacroContext {
  timestamp: string;
  period: { start: string; end: string };
  indicators: {
    gdp: MacroIndicatorData;
    gdpGrowth: MacroIndicatorData;
    inflation: MacroIndicatorData;
    unemployment: MacroIndicatorData;
    fedFundsRate: MacroIndicatorData;
  };
  summary: {
    economicCycle: "expansion" | "peak" | "contraction" | "trough";
    inflationEnvironment: "deflationary" | "low" | "moderate" | "high";
    laborMarket: "weak" | "softening" | "stable" | "tightening" | "tight";
    monetaryPolicy: "accommodative" | "neutral" | "restrictive";
    overallAssessment: string;
  };
}
```

### MacroIndicatorData

```typescript
interface MacroIndicatorData {
  seriesId: string;
  name: string;
  latestValue: number;
  latestDate: string;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: "rising" | "falling" | "stable";
  historicalData: Array<{ date: string; value: number }>;
}
```

## Indicadores FRED

Configurados en `lib/config/indicators.ts`:

| Indicador | Series ID | Frecuencia |
|-----------|-----------|------------|
| GDP | `GDP` | Trimestral |
| GDP Growth | `A191RL1Q225SBEA` | Trimestral |
| CPI (Inflacion) | `CPIAUCSL` | Mensual |
| Desempleo | `UNRATE` | Mensual |
| Fed Funds Rate | `FEDFUNDS` | Mensual |

## Variables de Entorno

```env
# .env.local
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4          # opcional, default: gpt-4
MCP_SERVER_URL=http://localhost:8000
```

## Dependencias Principales

```json
{
  "next": "16.1.1",
  "react": "19.2.3",
  "openai": "^4.75.0",
  "recharts": "^2.15.0",
  "tailwindcss": "^4"
}
```

## Ejecucion

```bash
# Instalar dependencias
cd client && npm install

# Configurar variables
cp .env.local.example .env.local
# Editar .env.local con tu OPENAI_API_KEY

# Desarrollo
npm run dev

# Produccion
npm run build && npm start
```

**Requisito:** El servidor Python MCP debe estar corriendo en puerto 8000.

## Paginas

| Ruta | Descripcion |
|------|-------------|
| `/` | Home page |
| `/t/[ticker]` | Analisis macro para un ticker (ej: `/t/AAPL`) |

## Extensibilidad

Para agregar nuevos sub-agentes:

1. Crear agente en `lib/agents/subagents/<nombre>/`
2. Registrar en `ChiefAgent.analyze()`
3. Agregar tipos en `lib/types/`
4. Actualizar UI para mostrar resultados
