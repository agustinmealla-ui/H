# MCP Client Documentation

Cliente TypeScript para comunicarse con el servidor MCP (Model Context Protocol) de FRED.

## Ubicacion

```
client/lib/mcp/client.ts
```

## Descripcion General

El `MCPClient` implementa el protocolo **MCP Streamable HTTP** para comunicarse con el servidor Python que expone herramientas de la API FRED (Federal Reserve Economic Data).

### Caracteristicas

- Protocolo JSON-RPC 2.0 sobre HTTP
- Soporte para respuestas JSON y SSE (Server-Sent Events)
- Gestion automatica de sesiones via header `mcp-session-id`
- Metodos tipados para herramientas FRED

## Arquitectura

```
┌─────────────────┐     HTTP/SSE      ┌─────────────────┐
│   MCPClient     │ ───────────────── │  Python Server  │
│   (TypeScript)  │   JSON-RPC 2.0    │   (FastMCP)     │
└─────────────────┘                   └─────────────────┘
        │                                     │
        │                                     │
   Next.js App                           FRED API
```

## API

### Constructor

```typescript
const client = new MCPClient(baseUrl?: string);
```

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `baseUrl` | string | `http://localhost:8000` | URL del servidor MCP |

### Metodos

#### `initialize(): Promise<void>`

Inicializa la sesion con el servidor MCP. Se llama automaticamente en la primera llamada a `callTool()`.

```typescript
await client.initialize();
```

#### `callTool<T>(toolName: string, args: Record<string, unknown>): Promise<T>`

Llama a una herramienta MCP de forma generica.

```typescript
const result = await client.callTool("fred_search_series", {
  search_text: "GDP",
  limit: 10
});
```

#### `searchSeries(searchText: string, options?): Promise<FREDSearchResponse>`

Busca series economicas en FRED.

```typescript
const results = await client.searchSeries("inflation", {
  limit: 5,
  searchType: "full_text"  // o "series_id"
});
```

**Respuesta:**
```typescript
interface FREDSearchResponse {
  count: number;
  seriess: Array<{
    id: string;           // e.g., "CPIAUCSL"
    title: string;        // e.g., "Consumer Price Index"
    frequency: string;    // e.g., "Monthly"
    units: string;        // e.g., "Index 1982-1984=100"
    last_updated: string;
  }>;
}
```

#### `getObservations(seriesId: string, options?): Promise<FREDObservationsResponse>`

Obtiene datos historicos de una serie FRED.

```typescript
const data = await client.getObservations("UNRATE", {
  observationStart: "2020-01-01",
  observationEnd: "2024-12-31",
  limit: 100,
  units: "lin"  // lin, chg, pch, pc1, etc.
});
```

**Respuesta:**
```typescript
interface FREDObservationsResponse {
  count: number;
  observations: Array<{
    date: string;   // "2024-01-01"
    value: string;  // "3.7"
  }>;
}
```

## Uso con Singleton

El modulo exporta una instancia singleton preconfigurada:

```typescript
import { mcpClient } from "@/lib/mcp/client";

// Usa directamente
const gdp = await mcpClient.getObservations("GDP", { limit: 12 });
```

La URL se configura via variable de entorno:

```env
MCP_SERVER_URL=http://localhost:8000
```

## Manejo de SSE

El cliente maneja automaticamente respuestas en formato SSE (Server-Sent Events):

```
event: message
data: {"jsonrpc": "2.0", "id": 1, "result": {...}}
```

El metodo `parseResponse()` detecta el `Content-Type` y parsea apropiadamente:
- `application/json` → `response.json()`
- `text/event-stream` → Parseo manual de lineas `data:`

## Headers Requeridos

Todas las peticiones incluyen:

```http
Content-Type: application/json
Accept: application/json, text/event-stream
mcp-session-id: <session-id>  # Despues de initialize()
```

## Series FRED Comunes

| Serie | ID | Descripcion |
|-------|-----|-------------|
| GDP | `GDP` | Producto Interno Bruto |
| GDP Growth | `A191RL1Q225SBEA` | Tasa de crecimiento del PIB real |
| Inflacion | `CPIAUCSL` | Indice de Precios al Consumidor |
| Desempleo | `UNRATE` | Tasa de desempleo |
| Fed Funds | `FEDFUNDS` | Tasa de fondos federales |

## Errores

Los errores del servidor se propagan como excepciones:

```typescript
try {
  await mcpClient.getObservations("INVALID_ID");
} catch (error) {
  // Error: "Series not found"
}
```

## Ejemplo Completo

```typescript
import { mcpClient } from "@/lib/mcp/client";

async function getMacroData() {
  // Obtener ultimos 12 puntos de desempleo
  const unemployment = await mcpClient.getObservations("UNRATE", {
    limit: 12
  });

  // Buscar series relacionadas con inflacion
  const inflationSeries = await mcpClient.searchSeries("inflation CPI", {
    limit: 5
  });

  return {
    unemployment: unemployment.observations,
    availableSeries: inflationSeries.seriess
  };
}
```
