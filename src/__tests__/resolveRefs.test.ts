import { describe, it, expect } from 'vitest';
import { findRefs, resolveAllRefs } from '../core/resolveRefs.js';
import { resolveEndpoint } from '../core/resolveEndpoint.js';
import {
  toJsonFormatter,
  toMarkdownFormatter,
  toCompactFormatter,
} from '../core/formatters.js';
import { OpenApiSpec, ResolvedEndpoint } from '../types/openapi.js';

describe('resolveRefs', () => {
  it('extracts direct and nested $ref strings from an object', () => {
    const mockObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserCreateDto',
            },
          },
        },
      },
    };

    const refs = findRefs(mockObject);
    expect(refs).toEqual(['UserCreateDto']);
  });

  it('resolves transitive and nested schema references', () => {
    const schemas = {
      UserDto: {
        type: 'object',
        properties: {
          address: { $ref: '#/components/schemas/AddressDto' },
          role: { $ref: '#/components/schemas/RoleEnum' },
        },
      },
      AddressDto: {
        type: 'object',
        properties: {
          country: { $ref: '#/components/schemas/CountryDto' },
        },
      },
      CountryDto: {
        type: 'object',
        properties: {
          code: { type: 'string' },
        },
      },
      RoleEnum: {
        type: 'string',
        enum: ['ADMIN', 'USER'],
      },
    };

    const resolvedRefs = resolveAllRefs(['UserDto'], schemas);
    expect(resolvedRefs).toEqual(
      new Set(['UserDto', 'AddressDto', 'RoleEnum', 'CountryDto'])
    );
  });

  it('handles circular references safely without infinite loops', () => {
    const circularSchemas = {
      NodeDto: {
        type: 'object',
        properties: {
          parent: { $ref: '#/components/schemas/NodeDto' },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/NodeDto' },
          },
        },
      },
    };

    const resolvedRefs = resolveAllRefs(['NodeDto'], circularSchemas);
    expect(resolvedRefs).toEqual(new Set(['NodeDto']));
  });
});

describe('resolveEndpoint', () => {
  const sampleSpec: OpenApiSpec = {
    openapi: '3.0.0',
    info: { title: 'Sample API', version: '1.0.0' },
    paths: {
      '/api/v1/users': {
        get: {
          summary: 'Get all users',
          responses: {
            '200': {
              description: 'Successful list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/UserDto' },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        UserDto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            profile: { $ref: '#/components/schemas/ProfileDto' },
          },
        },
        ProfileDto: {
          type: 'object',
          properties: {
            bio: { type: 'string' },
          },
        },
        UnusedDto: {
          type: 'object',
          properties: {
            secret: { type: 'string' },
          },
        },
      },
    },
  };

  it('resolves endpoint and includes only referenced schemas', () => {
    const resolved = resolveEndpoint(sampleSpec, 'GET', '/api/v1/users');
    expect(resolved).not.toBeNull();
    expect(resolved?.path).toBe('/api/v1/users');
    expect(resolved?.method).toBe('get');
    expect(Object.keys(resolved?.components.schemas || {})).toEqual([
      'UserDto',
      'ProfileDto',
    ]);
    expect(resolved?.components.schemas.UnusedDto).toBeUndefined();
  });

  it('returns null for unknown endpoint or method', () => {
    const resolvedUnknownPath = resolveEndpoint(sampleSpec, 'GET', '/unknown');
    expect(resolvedUnknownPath).toBeNull();

    const resolvedUnknownMethod = resolveEndpoint(sampleSpec, 'POST', '/api/v1/users');
    expect(resolvedUnknownMethod).toBeNull();
  });
});

describe('formatters', () => {
  const mockResolved: ResolvedEndpoint = {
    path: '/api/v1/auth/login',
    method: 'post',
    definition: {
      tags: ['auth-controller'],
      summary: 'Authenticate user',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        '400': {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
        '404': {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            email: { type: 'string' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer', format: 'int32', example: 404 },
            message: { type: 'string', example: 'User not found' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };

  it('toJsonFormatter produces pure JSON without modifying structure', () => {
    const jsonStr = toJsonFormatter(mockResolved);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.path).toBe('/api/v1/auth/login');
    expect(parsed.components.schemas.LoginRequest.properties.email.type).toBe('string');
  });

  it('toMarkdownFormatter produces property tables and groups error responses', () => {
    const mdStr = toMarkdownFormatter(mockResolved);
    expect(mdStr).toContain('# POST /api/v1/auth/login');
    expect(mdStr).toContain('**Security:** `bearerAuth (http bearer JWT)`');
    expect(mdStr).toContain('**DTO:** `LoginRequest`');
    expect(mdStr).toContain('| `email` | `string` | Yes |');
    expect(mdStr).toContain('### Error Responses (400, 404)');
    expect(mdStr).toContain('**Error Payload DTO:** `ApiErrorResponse`');
    expect(mdStr).toContain('| `status` | `integer (int32)` | No |');
  });

  it('toCompactFormatter produces token-efficient compact DSL output with zero data loss', () => {
    const dslStr = toCompactFormatter(mockResolved);

    // Assert Header & Security
    expect(dslStr).toContain('POST /api/v1/auth/login [auth-controller] [auth: bearerAuth (http bearer JWT)]');
    
    // Assert Request Struct & Required Field
    expect(dslStr).toContain('REQ (application/json): LoginRequest');
    expect(dslStr).toContain('email: string!');
    expect(dslStr).toContain('password: string!');

    // Assert Response Struct
    expect(dslStr).toContain('RESP 200 (OK) [application/json]: AuthResponse');
    expect(dslStr).toContain('token: string');

    // Assert Grouped Errors Struct & Examples
    expect(dslStr).toContain('ERRORS [400 Bad Request, 404 Not Found]: ApiErrorResponse');
    expect(dslStr).toContain('status: int32 (eg: 404)');
    expect(dslStr).toContain('message: string (eg: "User not found")');

    // Token size comparison check
    const jsonLength = toJsonFormatter(mockResolved).length;
    expect(dslStr.length).toBeLessThan(jsonLength * 0.45);
  });
});
