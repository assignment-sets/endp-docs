export interface OpenApiSpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, Record<string, OperationObject>>;
  definitions?: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, Record<string, unknown>>;
    securitySchemes?: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ParameterObject {
  name: string;
  in: string; // "query", "header", "path", "cookie"
  description?: string;
  required?: boolean;
  schema?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, {
    schema?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, {
      schema?: Record<string, unknown>;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  responses?: Record<string, ResponseObject>;
  security?: Array<Record<string, string[]>>;
  deprecated?: boolean;
  [key: string]: unknown;
}

export interface ResolvedEndpoint {
  path: string;
  method: string;
  definition: OperationObject;
  components: {
    schemas: Record<string, Record<string, unknown>>;
    securitySchemes: Record<string, Record<string, unknown>>;
  };
}

export interface EndpointSummary {
  method: string;
  path: string;
  summary?: string;
  tags?: string[];
  operationId?: string;
}

export interface EndpointDocsConfig {
  specUrl?: string;
}
