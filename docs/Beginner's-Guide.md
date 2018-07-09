## Introduction

Bcash is an _alternative_ implementation of the bitcoin protocol, written in node.js. It is a full node which can be used for full blockchain validation and is aware of all known consensus rules.

## Requirements

- Linux, OSX, or Windows (\*) (\*\*)
- node.js >=v7.6.0
- npm >=v4.0.0
- python2 (for node-gyp)
- gcc/g++ (for leveldb and secp256k1)
- git (optional, see below)

(\*): Note that bcash works best with unix-like OSes, and has not yet been thoroughly tested on windows.

(\*\*): The BSDs and Solaris have also not been tested yet, but should work in theory.

## Build & Install

Bcash is meant to be installed via npm, but for the security conscious, it may be better to clone from github.

### Installing via NPM

``` bash
$ npm install -g bcash --production
```

### Installing via Git

``` bash
$ git clone git://github.com/bcoin-org/bcash.git
$ cd bcash
$ npm install -g --production
```
### Installing via Docker

Check [bcash-docker](https://github.com/bcoin-org/bcash-docker)

### Installing on Windows

Install OpenSSL v1.0.2L 64-Bit:

https://slproweb.com/download/Win64OpenSSL-1_0_2L.exe

As Administrator, open `cmd.exe` and run:

```console
C:\Users\bcash\bcash>npm install --global --production windows-build-tools
```

to install `VCBuild.exe` and `Python 2.7.x` both required by `node-gyp`
for building native modules.

Then continue [Installing via Git](#installing-via-git)

Note that you need a shell that supports bash scripts, like Git Bash to launch
bcash.

### Troubleshooting

If the build fails compilation for `bcash-native` or `secp256k1-node` __validation will be slow__ (a block verification which should take 1 second on consumer grade hardware may take up to 15 seconds). Bcash will throw a warning on boot if it detects a build failure. If you run into this issue, please post an issue on the repo.

## Starting up your first bcash node

If bcash is installed globally, `$ bcash` should be in your PATH. If not, the bcash bootstrap script resides in `/path/to/bcash/bin/bcash`.

``` bash
$ bcash
```

Will run a bcash node as the foreground process, displaying all debug logs.

To run as a daemon:

``` bash
$ bcash --daemon
```

This will start up a full node, complete with: a blockchain, mempool, miner, p2p server, wallet server, and an HTTP REST+RPC server.

All logs will be written to `~/.bcash/debug.log` by default.

By default, the http server will only listen on `127.0.0.1:8332`. No auth will be required if an API key was not passed in. If you listen on any other host, auth will be required and an API key will be auto-generated if one was not passed in.

## Listening Externally

To listen publicly on the HTTP server, `--http-host=0.0.0.0` (ipv4) or `--http-host=::` (ipv4 and ipv6) can be passed. Additionally this: `--http-port=1337` can set the port.

To advertise your node on the P2P network `--public-host=[your-public-ip]` and `--public-port=[your-public-port]` may be passed.

## Using an API Key

If listening publicly on the HTTP server, an API key is required. One will be generated and reported in the logs automatically if no key was chosen. An api key can be chosen with the `--api-key` option.

Example:

``` bash
$ bcash --http-host=0.0.0.0 --api-key hunter2 --daemon
```

API keys are used with HTTP Basic Auth:

``` bash
$ curl http://x:hunter2@localhost:8332/
```

Bcash CLI is the prepackaged tool for hitting both the REST and RPC api.

``` bash
$ bcash cli info --api-key hunter2
$ bcash rpc getblockchaininfo --api-key hunter2
```

## Using Tor/SOCKS

Bcash has native support for SOCKS proxies, and will accept a `--proxy` option in the format of `--proxy=[user]:[pass]@host:port`.

Passing the `--onion` option tells bcash that the SOCKS proxy is a Tor socks proxy, and will enable Tor resolution for DNS lookups, as well as try to connect to `.onion` addresses found on the P2P network.

``` bash
$ bcash --proxy joe:hunter2@127.0.0.1:9050 --onion
```

### Running bcash as a tor hidden service

Your hidden service must first be configured with `tor`. Once you have the `.onion` address, it can be passed into `--public-host` in the form of `--public-host foo.onion`.

## Target Nodes

It's often desirable to run behind several trusted bitcoin nodes. To select permanent nodes to connect to, the `--nodes` option is available:

``` bash
$ bcash --nodes foo.example.com:8333,1.2.3.4:8333,5.6.7.8:8333
```

If chosen, bcash will _always_ try to connect to these nodes as outbound peers. They are top priority and whitelisted (not susceptible to permanent bans, only disconnections).

To _only_ connect to these nodes. `--max-outbound` could be set to 3:

``` bash
$ bcash --nodes foo.example.com,1.2.3.4,5.6.7.8 --max-outbound 3
```

## Disabling Listening

To avoid accepting connections on the P2P network altogether, `--listen=false` can be passed to bcash.

### Selfish Mode

Bcash also supports a "selfish" mode. In this mode, bcash still has full blockchain and mempool validation, but network services are disabled: it will not relay transactions or serve blocks to anyone.

``` bash
$ bcash --selfish --listen=false
```

Note: Selfish mode is not recommended. We encourage you to _help_ the network by relaying transactions and blocks. At the same time, selfish mode does have its uses if you do not have the bandwidth to spare, or if you're absolutely worried about potential DoS attacks.

## Further Configuration

See [Configuration][configuration].

[keybase]: https://keybase.io/chjj#show-public
[node]: https://nodejs.org/dist/v7.5.0/
[configuration]: Configuration.md
