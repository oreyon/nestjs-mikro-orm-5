# Installation Notes

- Config no unit test file when generate resources
```
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  },
  "generateOptions": {
    "spec": false
  }
}
```

<!-- core-package -->
nest new nest-mikro-orm-repository

npm i --save @nestjs/config

npm i cookie-parser
npm i -D @types/cookie-parser

npm i --save @nestjs/throttler

npm install --save @nestjs/swagger

npm install --save zod

npm install nest-winston

npm install --save bcrypt
npm install --save-dev @types/bcrypt

npm install --save uuid
npm install --save-dev @types/uuid

npm install --save argon2

npm install --save @nestjs/passport passport

npm install --save @nestjs/jwt passport-jwt
npm install --save-dev @types/passport-jwt

npm i --save nodemailer
npm i --save-dev @types/nodemailer

npm i -D @types/multer

npm i --save buffer-to-stream
npm i --save-dev @types/buffer-to-stream

npm i cloudinary
<!-- core-package -->

<!-- mikro-orm-core -->

<!-- cli is the most important after core dependency -->
// mikro-orm cli need to be installed in dependency to be able to use it in terminal docker

npm install --save @mikro-orm/cli

npm i -s @mikro-orm/core @mikro-orm/nestjs @mikro-orm/mysql

npm install --save @mikro-orm/cli @mikro-orm/entity-generator @mikro-orm/migrations @mikro-orm/reflection @mikro-orm/seeder @mikro-orm/sql-highlighter

npm install --save-dev pluralize @types/pluralize

<!-- mikro-orm-core -->

<!-- config mikro-orm package.json -->

```
  "mikro-orm": {
    "useTsNode": false,
    "tsConfigPath": "./tsconfig.json",
    "configPaths": [
      "./src/mikro-orm.config.ts",
      "./dist/mikro-orm.config.js"
    ],
    "entities": [
      "./src/**/*.entity.ts",
      "./dist/**/*.entity.js"
    ]
  }
```

<!-- config mikro-orm package.json -->

---

- install mikro cli for convinient terminal.
- create mikro-orm module to import methods
- create mikro-orm.config.ts as configuration settings of mikro orm
- just use migration instead of schema because the habit more safe
- create migration file
  npx mikro-orm migration:create
- migrate entity to database
  npx mikro-orm migration:up || npx mikro-orm migration:fresh
- updating table after changing the entity
  npx mikro-orm schema:update --run
  npx mikro-orm migration:up

- run build/compiled project in docker or production:
  npx mikro-orm debug
  npx mikro-orm migration:check
  npx mikro-orm migration:create
  npx mikro-orm migration:up

- Create database schema,This will also create the database if it does not exist.
  npx mikro-orm schema:create -r

npx mikro-orm schema:create --dump # Dumps create schema SQL
npx mikro-orm schema:update --dump # Dumps update schema SQL
npx mikro-orm schema:drop --dump # Dumps drop schema SQL

NOTE:
SchemaGenerator can do harm to your database. It will drop or alter tables, indexes, sequences and such. Please use this
tool with caution in development and not on a production server. It is meant for helping you develop your Database
Schema, but NOT with migrating schema from A to B in production. A safe approach would be generating the SQL on
development server and saving it into SQL Migration files that are executed manually on the production server.

    SchemaGenerator assumes your project uses the given database on its own. Update and Drop commands will mess with other tables if they are not related to the current project that is using MikroORM. Please be careful!

- naming strategy to plural
  npm install --save-dev pluralize @types/pluralize

- Trivia about saving data in datetime, timestamp, unix time(big int)
  timestamp(4 bytes): 2021-08-01 00:00:00
  datetime(5-8 bytes): 2021-08-01 00:00:00
  unix time(8 bytes | big int): 1627776000

timestamp and datetime is easier to query
unix time need more advanced to do query in database (from number to date and query)
example: select * from table where date = from_unixtime(1627776000)

---
COMMAND CLI

```bash

$ npx mikro-orm

Usage: mikro-orm <command> [options]

Commands:
  mikro-orm cache:clear             Clear metadata cache
  mikro-orm cache:generate          Generate metadata cache
  mikro-orm generate-entities       Generate entities based on current database schema
  mikro-orm database:create         Create your database if it does not exist
  mikro-orm database:import <file>  Imports the SQL file to the database
  mikro-orm seeder:run              Seed the database using the seeder class
  mikro-orm seeder:create <seeder>  Create a new seeder class
  mikro-orm schema:create           Create database schema based on currentmetadata
  mikro-orm schema:drop             Drop database schema based on current metadata
  mikro-orm schema:update           Update database schema based on current metadata
  mikro-orm schema:fresh            Drop and recreate database schema based on current metadata
  mikro-orm migration:create        Create new migration with current schema diff
  mikro-orm migration:up            Migrate up to the latest version
  mikro-orm migration:down          Migrate one step down
  mikro-orm migration:list          List all executed migrations
  mikro-orm migration:check         Check if migrations are needed. Useful for bash scripts.
  mikro-orm migration:pending       List all pending migrations
  mikro-orm migration:fresh         Clear the database and rerun all migrations
  mikro-orm debug                   Debug CLI configuration

Options:
      --config   Set path to the ORM configuration file                 [string]
  -v, --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  mikro-orm schema:update --run  Runs schema synchronization

```


