import { ResolvedEndpoint } from '../types/openapi.js';

export function toJsonFormatter(resolved: ResolvedEndpoint): string {
  return JSON.stringify(resolved, null, 2);
}

function extractRefName(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const record = obj as Record<string, unknown>;
  if (typeof record.$ref === 'string') {
    return record.$ref.split('/').pop() || null;
  }
  return null;
}

function formatTypeString(schemaObj: Record<string, unknown> | undefined): string {
  if (!schemaObj) return '`any`';

  const refName = extractRefName(schemaObj);
  if (refName) return `\`${refName}\``;

  const type = (schemaObj.type as string) || 'object';

  if (type === 'array' && schemaObj.items) {
    const itemSchema = schemaObj.items as Record<string, unknown>;
    const itemRef = extractRefName(itemSchema);
    if (itemRef) {
      return `\`Array<${itemRef}>\``;
    }
    const itemType = (itemSchema.type as string) || 'any';
    return `\`Array<${itemType}>\``;
  }

  if (schemaObj.enum && Array.isArray(schemaObj.enum)) {
    const enumVals = schemaObj.enum.map((v) => JSON.stringify(v)).join(' | ');
    return `\`enum (${enumVals})\``;
  }

  if (schemaObj.format) {
    return `\`${type} (${schemaObj.format})\``;
  }

  return `\`${type}\``;
}

function renderPropertyTable(
  properties: Record<string, Record<string, unknown>>,
  requiredList: string[] = []
): string[] {
  const lines: string[] = [];
  lines.push('| Field | Type | Required | Description / Example |');
  lines.push('| --- | --- | --- | --- |');

  for (const [propName, propObj] of Object.entries(properties)) {
    const isRequired = requiredList.includes(propName) ? 'Yes' : 'No';
    const typeStr = formatTypeString(propObj);

    const descParts: string[] = [];
    if (propObj.description) {
      descParts.push(String(propObj.description));
    }
    if (propObj.example !== undefined) {
      descParts.push(`*Example:* \`${JSON.stringify(propObj.example)}\``);
    }
    if (propObj.default !== undefined) {
      descParts.push(`*Default:* \`${JSON.stringify(propObj.default)}\``);
    }

    const descStr = descParts.length > 0 ? descParts.join(' — ') : '-';
    lines.push(`| \`${propName}\` | ${typeStr} | ${isRequired} | ${descStr} |`);
  }

  return lines;
}

function renderSchemaFields(
  schemaObj: Record<string, unknown> | undefined,
  schemas: Record<string, Record<string, unknown>>
): string[] {
  const lines: string[] = [];
  if (!schemaObj) return lines;

  const refName = extractRefName(schemaObj);
  if (refName && schemas[refName]) {
    lines.push(`**DTO:** \`${refName}\``);
    lines.push('');
    const targetSchema = schemas[refName];
    const props = targetSchema.properties as Record<string, Record<string, unknown>> | undefined;
    const req = (targetSchema.required as string[]) || [];
    if (props && Object.keys(props).length > 0) {
      lines.push(...renderPropertyTable(props, req));
    }
    return lines;
  }

  if (schemaObj.type === 'array' && schemaObj.items) {
    const itemSchema = schemaObj.items as Record<string, unknown>;
    const itemRef = extractRefName(itemSchema);
    if (itemRef && schemas[itemRef]) {
      lines.push(`**DTO:** \`Array<${itemRef}>\``);
      lines.push('');
      const targetSchema = schemas[itemRef];
      const props = targetSchema.properties as Record<string, Record<string, unknown>> | undefined;
      const req = (targetSchema.required as string[]) || [];
      if (props && Object.keys(props).length > 0) {
        lines.push(...renderPropertyTable(props, req));
      }
      return lines;
    }
  }

  const props = schemaObj.properties as Record<string, Record<string, unknown>> | undefined;
  const req = (schemaObj.required as string[]) || [];
  if (props && Object.keys(props).length > 0) {
    lines.push(...renderPropertyTable(props, req));
  } else {
    lines.push('```json');
    lines.push(JSON.stringify(schemaObj, null, 2));
    lines.push('```');
  }

  return lines;
}

export function toMarkdownFormatter(resolved: ResolvedEndpoint): string {
  const method = resolved.method.toUpperCase();
  const path = resolved.path;
  const def = resolved.definition;
  const schemas = resolved.components.schemas;
  const securitySchemes = resolved.components.securitySchemes;

  const lines: string[] = [];

  lines.push(`# ${method} ${path}`);
  lines.push('');

  if (def.summary) {
    lines.push(`**Summary:** ${def.summary}`);
    lines.push('');
  }

  if (def.description) {
    lines.push(`**Description:** ${def.description}`);
    lines.push('');
  }

  if (def.tags && def.tags.length > 0) {
    lines.push(`**Tags:** ${def.tags.join(', ')}`);
    lines.push('');
  }

  // Security Schemes
  if (def.security && def.security.length > 0) {
    const secBadges: string[] = [];
    for (const secObj of def.security) {
      for (const [secName, scopes] of Object.entries(secObj)) {
        const secDef = securitySchemes[secName];
        let detail = secName;
        if (secDef) {
          const type = secDef.type ? String(secDef.type) : '';
          const scheme = secDef.scheme ? String(secDef.scheme) : '';
          const format = secDef.bearerFormat ? String(secDef.bearerFormat) : '';
          const parts = [type, scheme, format].filter(Boolean);
          if (parts.length > 0) {
            detail += ` (${parts.join(' ')})`;
          }
        }
        if (scopes.length > 0) {
          detail += ` [scopes: ${scopes.join(', ')}]`;
        }
        secBadges.push(`\`${detail}\``);
      }
    }
    if (secBadges.length > 0) {
      lines.push(`**Security:** ${secBadges.join(', ')}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');

  // Parameters
  if (def.parameters && def.parameters.length > 0) {
    lines.push('## Parameters');
    lines.push('');
    lines.push('| Name | In | Required | Type | Description / Example |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const param of def.parameters) {
      const typeStr = param.schema
        ? formatTypeString(param.schema as Record<string, unknown>)
        : `\`${param.type || 'any'}\``;

      const descParts: string[] = [];
      if (param.description) descParts.push(String(param.description));
      if (param.example !== undefined) descParts.push(`*Example:* \`${JSON.stringify(param.example)}\``);

      lines.push(
        `| \`${param.name}\` | \`${param.in}\` | ${param.required ? 'Yes' : 'No'} | ${typeStr} | ${descParts.length > 0 ? descParts.join(' — ') : '-'} |`
      );
    }
    lines.push('');
  }

  // Request Body
  if (def.requestBody) {
    lines.push('## Request Body');
    lines.push('');
    if (def.requestBody.description) {
      lines.push(`_${def.requestBody.description}_`);
      lines.push('');
    }
    if (def.requestBody.content) {
      for (const [mediaType, contentObj] of Object.entries(def.requestBody.content)) {
        lines.push(`**Content-Type:** \`${mediaType}\``);
        lines.push('');
        if (contentObj.schema) {
          lines.push(...renderSchemaFields(contentObj.schema as Record<string, unknown>, schemas));
          lines.push('');
        }
      }
    }
  }

  // Responses
  if (def.responses) {
    lines.push('## Responses');
    lines.push('');

    const entries = Object.entries(def.responses);
    const successEntries: Array<[string, typeof entries[0][1]]> = [];
    const errorEntries: Array<[string, typeof entries[0][1]]> = [];

    for (const [code, resp] of entries) {
      const codeNum = parseInt(code, 10);
      if (!isNaN(codeNum) && codeNum >= 400) {
        errorEntries.push([code, resp]);
      } else {
        successEntries.push([code, resp]);
      }
    }

    // Success responses
    for (const [code, resp] of successEntries) {
      lines.push(`### ${code}${resp.description ? ' - ' + resp.description : ''}`);
      lines.push('');
      if (resp.content) {
        for (const [mediaType, contentObj] of Object.entries(resp.content)) {
          lines.push(`**Content-Type:** \`${mediaType}\``);
          lines.push('');
          if (contentObj.schema) {
            lines.push(...renderSchemaFields(contentObj.schema as Record<string, unknown>, schemas));
            lines.push('');
          }
        }
      } else if (resp.schema) {
        lines.push(...renderSchemaFields(resp.schema as Record<string, unknown>, schemas));
        lines.push('');
      }
    }

    // Error responses grouping logic
    if (errorEntries.length > 0) {
      const schemaGroups = new Map<string, Array<[string, typeof entries[0][1]]>>();

      for (const [code, resp] of errorEntries) {
        let schemaRef = 'custom';
        let schemaObj: Record<string, unknown> | undefined;

        if (resp.content) {
          const firstContent = Object.values(resp.content)[0];
          if (firstContent?.schema) schemaObj = firstContent.schema as Record<string, unknown>;
        } else if (resp.schema) {
          schemaObj = resp.schema as Record<string, unknown>;
        }

        if (schemaObj) {
          const refName = extractRefName(schemaObj);
          if (refName) schemaRef = refName;
        }

        if (!schemaGroups.has(schemaRef)) {
          schemaGroups.set(schemaRef, []);
        }
        schemaGroups.get(schemaRef)!.push([code, resp]);
      }

      for (const [schemaRef, group] of schemaGroups.entries()) {
        if (group.length > 1 && schemaRef !== 'custom') {
          const statusCodesStr = group.map(([c]) => c).join(', ');
          lines.push(`### Error Responses (${statusCodesStr})`);
          lines.push('');
          lines.push('| Status Code | Description |');
          lines.push('| --- | --- |');
          for (const [code, resp] of group) {
            lines.push(`| \`${code}\` | ${resp.description || '-'} |`);
          }
          lines.push('');

          lines.push(`**Error Payload DTO:** \`${schemaRef}\``);
          lines.push('');
          if (schemas[schemaRef]) {
            const targetSchema = schemas[schemaRef];
            const props = targetSchema.properties as Record<string, Record<string, unknown>> | undefined;
            const req = (targetSchema.required as string[]) || [];
            if (props && Object.keys(props).length > 0) {
              lines.push(...renderPropertyTable(props, req));
              lines.push('');
            }
          }
        } else {
          for (const [code, resp] of group) {
            lines.push(`### ${code}${resp.description ? ' - ' + resp.description : ''}`);
            lines.push('');
            if (resp.content) {
              for (const [mediaType, contentObj] of Object.entries(resp.content)) {
                lines.push(`**Content-Type:** \`${mediaType}\``);
                lines.push('');
                if (contentObj.schema) {
                  lines.push(...renderSchemaFields(contentObj.schema as Record<string, unknown>, schemas));
                  lines.push('');
                }
              }
            } else if (resp.schema) {
              lines.push(...renderSchemaFields(resp.schema as Record<string, unknown>, schemas));
              lines.push('');
            }
          }
        }
      }
    }
  }

  // Referenced Component Schemas
  const schemaNames = Object.keys(schemas);
  if (schemaNames.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Raw Referenced Schemas / DTOs');
    lines.push('');
    lines.push('<details>');
    lines.push('<summary>Click to view raw JSON schemas</summary>');
    lines.push('');
    for (const name of schemaNames) {
      lines.push(`### \`${name}\``);
      lines.push('```json');
      lines.push(JSON.stringify(schemas[name], null, 2));
      lines.push('```');
      lines.push('');
    }
    lines.push('</details>');
    lines.push('');
  }

  return lines.join('\n');
}

// --------------------------------------------------------------------------
// TOKEN-OPTIMIZED COMPACT DSL FORMATTER (--format compact / dsl / min)
// --------------------------------------------------------------------------

function formatCompactType(schemaObj: Record<string, unknown> | undefined): string {
  if (!schemaObj) return 'any';

  const refName = extractRefName(schemaObj);
  if (refName) return refName;

  const type = (schemaObj.type as string) || 'object';

  if (type === 'array' && schemaObj.items) {
    const itemSchema = schemaObj.items as Record<string, unknown>;
    const itemRef = extractRefName(itemSchema);
    if (itemRef) return `array<${itemRef}>`;
    const itemType = (itemSchema.type as string) || 'any';
    return `array<${itemType}>`;
  }

  if (schemaObj.enum && Array.isArray(schemaObj.enum)) {
    const enumVals = schemaObj.enum.map((v) => JSON.stringify(v)).join(' | ');
    return `enum(${enumVals})`;
  }

  if (schemaObj.format) {
    return `${schemaObj.format}`;
  }

  return type;
}

function renderCompactStruct(
  schemaName: string,
  schemas: Record<string, Record<string, unknown>>,
  renderedSet: Set<string>
): string[] {
  const lines: string[] = [];
  if (renderedSet.has(schemaName)) return lines;
  renderedSet.add(schemaName);

  const targetSchema = schemas[schemaName];
  if (!targetSchema) return lines;

  lines.push(`${schemaName} {`);

  const props = targetSchema.properties as Record<string, Record<string, unknown>> | undefined;
  const reqList = (targetSchema.required as string[]) || [];

  if (props) {
    for (const [pName, pObj] of Object.entries(props)) {
      const typeStr = formatCompactType(pObj);
      const isReq = reqList.includes(pName) ? '!' : '';

      const notes: string[] = [];
      if (pObj.example !== undefined) {
        notes.push(`eg: ${JSON.stringify(pObj.example)}`);
      } else if (pObj.default !== undefined) {
        notes.push(`default: ${JSON.stringify(pObj.default)}`);
      } else if (pObj.description) {
        notes.push(String(pObj.description));
      }

      const noteStr = notes.length > 0 ? ` (${notes.join(', ')})` : '';
      lines.push(`  ${pName}: ${typeStr}${isReq}${noteStr}`);
    }
  }

  lines.push('}');
  lines.push('');

  // Recursively render referenced child DTOs
  if (props) {
    for (const pObj of Object.values(props)) {
      const childRef = extractRefName(pObj);
      if (childRef && schemas[childRef]) {
        lines.push(...renderCompactStruct(childRef, schemas, renderedSet));
      }
      if (pObj.type === 'array' && pObj.items) {
        const itemRef = extractRefName(pObj.items as Record<string, unknown>);
        if (itemRef && schemas[itemRef]) {
          lines.push(...renderCompactStruct(itemRef, schemas, renderedSet));
        }
      }
    }
  }

  return lines;
}

export function toCompactFormatter(resolved: ResolvedEndpoint): string {
  const method = resolved.method.toUpperCase();
  const path = resolved.path;
  const def = resolved.definition;
  const schemas = resolved.components.schemas;
  const securitySchemes = resolved.components.securitySchemes;

  const lines: string[] = [];
  const renderedSet = new Set<string>();

  // Header line
  let header = `${method} ${path}`;
  if (def.tags && def.tags.length > 0) {
    header += ` [${def.tags.join(', ')}]`;
  }

  if (def.security && def.security.length > 0) {
    const secBadges: string[] = [];
    for (const secObj of def.security) {
      for (const [secName, scopes] of Object.entries(secObj)) {
        const secDef = securitySchemes[secName];
        let detail = secName;
        if (secDef) {
          const type = secDef.type ? String(secDef.type) : '';
          const scheme = secDef.scheme ? String(secDef.scheme) : '';
          const format = secDef.bearerFormat ? String(secDef.bearerFormat) : '';
          const parts = [type, scheme, format].filter(Boolean);
          if (parts.length > 0) detail += ` (${parts.join(' ')})`;
        }
        if (scopes.length > 0) detail += ` [${scopes.join(', ')}]`;
        secBadges.push(detail);
      }
    }
    if (secBadges.length > 0) {
      header += ` [auth: ${secBadges.join(', ')}]`;
    }
  }

  lines.push(header);
  lines.push('');

  if (def.summary) {
    lines.push(`// ${def.summary}`);
    lines.push('');
  }

  // Parameters
  if (def.parameters && def.parameters.length > 0) {
    for (const param of def.parameters) {
      const pName = param.name || (param as unknown as Record<string, string>).$ref?.split('/').pop() || 'param';
      const pIn = param.in || 'param';
      const pType = param.schema ? formatCompactType(param.schema as Record<string, unknown>) : (param.type || 'any');
      const isReq = param.required ? '!' : '';
      const notes: string[] = [];
      if (param.description) notes.push(String(param.description));
      if (param.example !== undefined) notes.push(`eg: ${JSON.stringify(param.example)}`);
      const noteStr = notes.length > 0 ? ` (${notes.join(', ')})` : '';

      lines.push(`PARAM ${pName}: ${pIn} ${pType}${isReq}${noteStr}`);
    }
    lines.push('');
  }

  // Request Body
  if (def.requestBody?.content) {
    for (const [contentType, contentObj] of Object.entries(def.requestBody.content)) {
      const schemaObj = contentObj.schema as Record<string, unknown> | undefined;
      const refName = extractRefName(schemaObj);

      if (refName) {
        lines.push(`REQ (${contentType}): ${refName}`);
        lines.push('');
        lines.push(...renderCompactStruct(refName, schemas, renderedSet));
      } else if (schemaObj) {
        const pType = formatCompactType(schemaObj);
        lines.push(`REQ (${contentType}): ${pType}`);
        lines.push('');
      }
    }
  }

  // Responses
  if (def.responses) {
    const entries = Object.entries(def.responses);
    const successEntries: Array<[string, typeof entries[0][1]]> = [];
    const errorEntries: Array<[string, typeof entries[0][1]]> = [];

    for (const [code, resp] of entries) {
      const codeNum = parseInt(code, 10);
      if (!isNaN(codeNum) && codeNum >= 400) {
        errorEntries.push([code, resp]);
      } else {
        successEntries.push([code, resp]);
      }
    }

    // Success responses
    for (const [code, resp] of successEntries) {
      let contentType = '*/*';
      let schemaObj: Record<string, unknown> | undefined;

      if (resp.content) {
        const [ct, cObj] = Object.entries(resp.content)[0] || [];
        if (ct) contentType = ct;
        if (cObj?.schema) schemaObj = cObj.schema as Record<string, unknown>;
      } else if (resp.schema) {
        schemaObj = resp.schema as Record<string, unknown>;
      }

      const descStr = resp.description ? ` (${resp.description})` : '';
      const refName = extractRefName(schemaObj);

      if (refName) {
        lines.push(`RESP ${code}${descStr} [${contentType}]: ${refName}`);
        lines.push('');
        lines.push(...renderCompactStruct(refName, schemas, renderedSet));
      } else if (schemaObj) {
        const typeStr = formatCompactType(schemaObj);
        lines.push(`RESP ${code}${descStr} [${contentType}]: ${typeStr}`);
        lines.push('');
      } else {
        lines.push(`RESP ${code}${descStr}`);
        lines.push('');
      }
    }

    // Error responses
    if (errorEntries.length > 0) {
      const schemaGroups = new Map<string, Array<[string, typeof entries[0][1]]>>();

      for (const [code, resp] of errorEntries) {
        let schemaRef = 'custom';
        let schemaObj: Record<string, unknown> | undefined;

        if (resp.content) {
          const firstContent = Object.values(resp.content)[0];
          if (firstContent?.schema) schemaObj = firstContent.schema as Record<string, unknown>;
        } else if (resp.schema) {
          schemaObj = resp.schema as Record<string, unknown>;
        }

        if (schemaObj) {
          const refName = extractRefName(schemaObj);
          if (refName) schemaRef = refName;
        }

        if (!schemaGroups.has(schemaRef)) schemaGroups.set(schemaRef, []);
        schemaGroups.get(schemaRef)!.push([code, resp]);
      }

      for (const [schemaRef, group] of schemaGroups.entries()) {
        if (group.length > 1 && schemaRef !== 'custom') {
          const statusList = group.map(([c, r]) => `${c}${r.description ? ' ' + r.description : ''}`).join(', ');
          lines.push(`ERRORS [${statusList}]: ${schemaRef}`);
          lines.push('');
          lines.push(...renderCompactStruct(schemaRef, schemas, renderedSet));
        } else {
          for (const [code, resp] of group) {
            let schemaObj: Record<string, unknown> | undefined;
            if (resp.content) {
              schemaObj = Object.values(resp.content)[0]?.schema as Record<string, unknown>;
            } else if (resp.schema) {
              schemaObj = resp.schema as Record<string, unknown>;
            }

            const descStr = resp.description ? ` ${resp.description}` : '';
            const refName = extractRefName(schemaObj);

            if (refName) {
              lines.push(`ERR ${code}${descStr}: ${refName}`);
              lines.push('');
              lines.push(...renderCompactStruct(refName, schemas, renderedSet));
            } else {
              lines.push(`ERR ${code}${descStr}`);
              lines.push('');
            }
          }
        }
      }
    }
  }

  // Any leftover unrendered DTO schemas
  for (const sName of Object.keys(schemas)) {
    if (!renderedSet.has(sName)) {
      lines.push(...renderCompactStruct(sName, schemas, renderedSet));
    }
  }

  return lines.join('\n').trim();
}
