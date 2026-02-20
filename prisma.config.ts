import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'frontend/prisma/schema.prisma',
  migrations: {
    path: 'frontend/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})

