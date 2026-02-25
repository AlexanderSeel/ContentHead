import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';

import { Kind, parse, buildSchema } from 'graphql';

const REPO_ROOT = resolve(process.cwd(), '../..');
const SCHEMA_PATH = resolve(REPO_ROOT, 'packages/schema/dist/schema.graphql');
const TARGET_DIRS = [
  'apps/admin/src/graphql',
  'apps/web/src/graphql',
  'packages/sdk/src/graphql'
].map((dir) => resolve(REPO_ROOT, dir));

type Usage = {
  source: string;
  operationType: 'query' | 'mutation' | 'subscription';
  rootField: string | null;
  existsInSchema: boolean;
};

type ManifestEntry = {
  operationName: string;
  usages: Usage[];
};

async function walkGraphqlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return walkGraphqlFiles(fullPath);
      }
      if (entry.isFile() && fullPath.endsWith('.graphql')) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

function toRepoPath(file: string): string {
  return relative(REPO_ROOT, file).replaceAll('\\\\', '/');
}

async function main(): Promise<void> {
  const schemaSdl = await readFile(SCHEMA_PATH, 'utf8');
  const schema = buildSchema(schemaSdl);
  const queryFields = schema.getQueryType()?.getFields() ?? {};
  const mutationFields = schema.getMutationType()?.getFields() ?? {};
  const subscriptionFields = schema.getSubscriptionType()?.getFields() ?? {};

  const files = (await Promise.all(TARGET_DIRS.map((dir) => walkGraphqlFiles(dir)))).flat();
  const byOperation = new Map<string, ManifestEntry>();

  for (const file of files) {
    const sourceText = await readFile(file, 'utf8');
    const document = parse(sourceText);
    for (const definition of document.definitions) {
      if (definition.kind !== Kind.OPERATION_DEFINITION || !definition.name?.value) {
        continue;
      }
      const operationType = definition.operation;
      const rootFieldSelection = definition.selectionSet.selections.find((selection) => selection.kind === Kind.FIELD);
      const rootField = rootFieldSelection?.kind === Kind.FIELD ? rootFieldSelection.name.value : null;

      const existsInSchema =
        operationType === 'query'
          ? Boolean(rootField && queryFields[rootField])
          : operationType === 'mutation'
            ? Boolean(rootField && mutationFields[rootField])
            : Boolean(rootField && subscriptionFields[rootField]);

      const entry = byOperation.get(definition.name.value) ?? {
        operationName: definition.name.value,
        usages: []
      };

      entry.usages.push({
        source: toRepoPath(file),
        operationType,
        rootField,
        existsInSchema
      });
      byOperation.set(definition.name.value, entry);
    }
  }

  const manifest = Array.from(byOperation.values()).sort((a, b) => a.operationName.localeCompare(b.operationName));
  const missing = manifest.flatMap((entry) =>
    entry.usages
      .filter((usage) => !usage.existsInSchema)
      .map((usage) => ({ operationName: entry.operationName, ...usage }))
  );

  const outputPath = resolve(REPO_ROOT, 'docs/graphql-operations-manifest.json');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  if (missing.length > 0) {
    console.error('Missing GraphQL operations in schema:', JSON.stringify(missing, null, 2));
    process.exit(1);
  }

  console.log(`Generated ${manifest.length} operation entries at ${toRepoPath(outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
