# phrck-cardano-graphql
Cardano blockchain explorer with GraphQL API for PHRCK stake pool.

**[Staking Rocks!](https://staking.rocks)** is a stake pool on the Cardano blockchain network (Ticker code: **PHRCK**). This project is *PHRCK*'s GraphQL API for exploring the Cardano blockchain. It is based on IOHK's [cardano-db-sync](https://github.com/input-output-hk/cardano-db-sync) and [cardano-graphql](https://github.com/input-output-hk/cardano-graphql).

## How to deploy
1. Clone cardano-graphql into your server.
    ```
    git clone https://github.com/input-output-hk/cardano-graphql.git;\
    cd cardano-graphql
    ```
1. Get the bash script from this repo and make it executable.
    ```
    wget https://raw.githubusercontent.com/inimrod/phrck-cardano-graphql/master/phrck-config.sh;\
    chmod +x phrck-config.sh
    ```
1. Edit the bash script and provide the secrets for postgres and other variables.
    ```
    nano phrck-config.sh
    ```
1. Run bash script.
    ```
    ./phrck-config.sh
    ```
1. Run `docker-compose`:
    ```
    docker-compose up -d; docker-compose logs -f
    `````
1. Start working with Hasura to config your GraphQL API schemas. Go to `http://yourdomain:[port]/console`