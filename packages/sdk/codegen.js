const config = {
    schema: '../schema/dist/schema.graphql',
    documents: ['src/graphql/**/*.graphql'],
    generates: {
        'src/graphql/generated.ts': {
            plugins: ['typescript', 'typescript-operations', 'typed-document-node']
        }
    },
    ignoreNoDocuments: false
};
export default config;
