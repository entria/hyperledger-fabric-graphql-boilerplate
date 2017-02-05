# Hyperledger Fabric GraphQL Boilerplate

This is a boilerplate to start using hyperledger fabric blockchain with GraphQL

- based on: [fabric-boilerplate](https://github.com/IBM-Blockchain/fabric-boilerplate)
- based on GraphQL boilerplate code: [graphql-dataloader-boilerplate](https://github.com/entria/graphql-dataloader-boilerplate)
- [Create-GraphQL](https://github.com/lucasbento/create-graphql) was used to generate GraphQL boilerplate

## Hire us
You can hire us to build your next blockchain project using Hyperledger and GraphQL - [Entria](http://entria.com.br/)

## How to build Go chaincode locally

### Install go
```
brew install go
mkdir ~/.go
```

### Configure GOPATH
add this to .bashrc
```
export GOPATH="${HOME}/.go"
export GOROOT="$(brew --prefix golang)/libexec"
```

```
yarn go:install
```

then
```
yarn go:build
```

# Run locally with docker-compose
Clear content of deploy/local before creating new containers
```
yarn clear
```

```
docker-compose up
```

## Test if it is running ok
go to `http://localhost:7050/chain`

## Go to Hyperledger Explorer
go to `http://localhost:9090`

## How to test chaincode
```
yarn run go:test
```

## How to interact with chain

```
yarn repl
```

Query data for an entity (**a** and **b** are the valid entities for now)

```
bl > queryEntity('a')
```

Transfer **coins** from an entity to another
```
bl > transfer('a', 'b', 10)
```

### How to deploy a new chaincode using GraphQL

```graphql
mutation deployChain {
 Deploy(input: {
  fcn:"init"
  args: ["a", "100", "b", "200"]
  clientMutationId:"1"
	}) {
  	results
	}
}
```



