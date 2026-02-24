export function getApiGraphqlUrl() {
  const raw = (import.meta.env.VITE_API_URL ?? '').trim();
  return raw ? raw : 'http://localhost:4000/graphql';
}

export function getApiBaseUrl() {
  const graphqlUrl = getApiGraphqlUrl();
  return graphqlUrl.endsWith('/graphql') ? graphqlUrl.slice(0, -'/graphql'.length) : graphqlUrl;
}
