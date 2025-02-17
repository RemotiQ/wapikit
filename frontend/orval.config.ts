import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../spec.openapi.yaml',
    output: {
      packageJson: './package.json',
      mode: 'single',
      prettier: true,
      client: 'react-query',
      tsconfig: './tsconfig.json',
      target: './.generated.ts',
      headers: false,
      override: {
        operations: {
          getConversationMessages: {
            query: {
              useInfiniteQueryParam: 'page',
              useInfinite: true,
              useQuery: true,
              signal: true,
            }
          }
        },
        mutator: {
          path: './src/utils/api-client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          signal: true
        }
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write"
    }
  },
});