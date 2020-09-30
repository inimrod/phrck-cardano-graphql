// location: packages/api-cardano-db-hasura/src/Config.ts
export interface Config {
    db: {
      database: string,
      host: string,
      password: string,
      port: number
      user: string,
    },
    hasuraUri: string,
    hasuraAdminSecret: string
  }
  