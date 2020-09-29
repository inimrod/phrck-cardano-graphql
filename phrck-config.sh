#!/bin/bash
#
# ======== config ===========
POSTGRES_DB="psqldb"
POSTGRES_USER="psqluser"
POSTGRES_PASSWORD="supersecurepassword"
CARDANO_GRAPHQL_VERSION="2.2.0"
HASURA_GRAPHQL_ENGINE_VER="v1.3.2.cli-migrations-v2"
HASURA_GRAPHQL_ENGINE_PORT="8080"
HASURA_GRAPHQL_ADMIN_SECRET="supersecretadminpassword"
# ====== eof config ========

rm -vf docker-compose.yml
wget https://raw.githubusercontent.com/inimrod/phrck-cardano-graphql/master/docker-compose.yml

# .env file for docker-compose:
rm -vf .env
cat > .env << EOF
HASURA_GRAPHQL_ADMIN_SECRET=${HASURA_GRAPHQL_ADMIN_SECRET}
CARDANO_DB_SYNC_VERSION=5.0.1
CARDANO_GRAPHQL_VERSION=${CARDANO_GRAPHQL_VERSION}
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
EOF

# postgres secrets:
echo ${POSTGRES_DB} > config/secrets/postgres_db
echo ${POSTGRES_USER} > config/secrets/postgres_user
echo ${POSTGRES_PASSWORD} > config/secrets/postgres_password

# hasura image version:
cat > packages/api-cardano-db-hasura/hasura/Dockerfile << EOF
FROM hasura/graphql-engine:${HASURA_GRAPHQL_ENGINE_VER}
COPY docker-entrypoint.sh /bin/
EXPOSE ${HASURA_GRAPHQL_ENGINE_PORT}
EOF