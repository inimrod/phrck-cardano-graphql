// location: packages/api-cardano-db-hasura/src/
import { ApolloClient, gql, InMemoryCache, NormalizedCacheObject } from 'apollo-boost'
import { createHttpLink } from 'apollo-link-http'
import util from '@cardano-graphql/util'
import { exec } from 'child_process'
import fetch from 'cross-fetch'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { DocumentNode, print } from 'graphql'
import { introspectSchema, wrapSchema } from '@graphql-tools/wrap'
import pRetry from 'p-retry'
import path from 'path'

dayjs.extend(utc)

export class HasuraClient {
  private client: ApolloClient<NormalizedCacheObject>
  readonly hasuraUri: string
  readonly hasuraAdminSecret: string
  private applyingSchemaAndMetadata: boolean

  constructor (hasuraUri: string, hasuraAdminSecret: string) {
    this.hasuraUri = hasuraUri
    this.hasuraAdminSecret = hasuraAdminSecret
    this.client = new ApolloClient({
      cache: new InMemoryCache({
        addTypename: false
      }),
      defaultOptions: {
        query: {
          fetchPolicy: 'network-only'
        }
      },
      link: createHttpLink({
        uri: `${this.hasuraUri}/v1/graphql`,
        fetch,
        headers: {
          'X-Hasura-Role': 'cardano-graphql'
        }
      })
    })
  }

  public async applySchemaAndMetadata (): Promise<void> {
    if (this.applyingSchemaAndMetadata) return
    this.applyingSchemaAndMetadata = true
    await pRetry(async () => {
      await this.hasuraCli('migrate apply --down all --admin-secret '+this.hasuraAdminSecret)
      await this.hasuraCli('migrate apply --up all --admin-secret '+this.hasuraAdminSecret)
      await this.hasuraCli('metadata clear --admin-secret '+this.hasuraAdminSecret)
      await this.hasuraCli('metadata apply --admin-secret '+this.hasuraAdminSecret)
    }, {
      factor: 1.75,
      retries: 9,
      onFailedAttempt: util.onFailedAttemptFor('Applying PostgreSQL schema and Hasura metadata')
    })
    this.applyingSchemaAndMetadata = false
  }

  public async buildHasuraSchema () {
    await this.applySchemaAndMetadata()
    const executor = async ({ document, variables }: { document: DocumentNode, variables?: Object }) => {
      const query = print(document)
      try {
        const fetchResult = await fetch(`${this.hasuraUri}/v1/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Hasura-Role': 'cardano-graphql'
          },
          body: JSON.stringify({ query, variables })
        })
        return fetchResult.json()
      } catch (error) {
        console.error(error)
        throw error
      }
    }
    const coreTypes = [
      'Block',
      'Cardano',
      'Epoch',
      'Block',
      'Transaction'
    ]
    const schema = wrapSchema({
      schema: await introspectSchema(executor),
      executor
    })
    for (const t of coreTypes) {
      const gqlType = schema.getType(t)
      if (!gqlType) {
        throw new Error(`Remote schema is missing ${t}`)
      }
    }
    return schema
  }

  public async getMeta () {
    const result = await this.client.query({
      query: gql`query {
          cardano {
              tip {
                  forgedAt
              }
          }}`
    })
    const { tip } = result.data?.cardano[0]
    const currentUtc = dayjs().utc()
    const tipUtc = dayjs.utc(tip.forgedAt)
    return {
      initialized: tipUtc.isAfter(currentUtc.subtract(120, 'second')),
      syncPercentage: (tipUtc.valueOf() / currentUtc.valueOf()) * 100
    }
  }

  async hasuraCli (command: string) {
    return new Promise((resolve, reject) => {
      exec(
        `hasura --skip-update-check --project ${path.resolve(__dirname, '..', 'hasura', 'project')} --endpoint ${this.hasuraUri} ${command}`,
        (error, stdout) => {
          if (error) {
            reject(error)
          }
          console.log(stdout)
          resolve()
        }
      )
    })
  }
}
