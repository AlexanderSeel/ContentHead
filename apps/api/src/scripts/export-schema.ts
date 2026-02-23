import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { lexicographicSortSchema, printSchema } from 'graphql';

import { schema } from '../graphql/schema.js';

async function main(): Promise<void> {
  const sorted = lexicographicSortSchema(schema);
  const sdl = `${printSchema(sorted).trim()}\n`;
  const targetPath = resolve(process.cwd(), '../../packages/schema/dist/schema.graphql');

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, sdl, 'utf8');

  console.log(`Exported schema to ${targetPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});