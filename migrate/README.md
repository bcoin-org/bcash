Bcash Migrations
================

There are no migrations necessary for bcash. Current database versions are as
follows:
  - ChainDB - `v5`
  - WalletDB - `v7`
  - Mempool - `v0`
  - Indexer - `v0`

*Note: Lastest version of bcoin does not have separate Indexer and its ChainDB
is at `v4`(See [Refactor Indexers][bcoin-indexers]), but WalletDB is
compatible.*

[bcoin-indexers]: https://github.com/bcoin-org/bcoin/pull/424
