Bcash ships with bcoin-cli as its default HTTP client for command line access.

## Configuration

Examples:

``` bash
$ export BCASH_API_KEY=hunter2
$ export BCASH_NETWORK=main
$ export BCASH_URI=http://localhost:8332
$ bcash cli info
```

``` bash
$ bcash cli info --api-key=hunter2 --uri=http://localhost
```

``` bash
$ echo 'api-key: hunter2' > ~/cli.conf
$ bcash cli info --config=~/cli.conf
```

## Examples

``` bash
$ export BCASH_API_KEY=your-api-key

# View the genesis block
$ bcash cli block 0

# View the mempool
$ bcash cli mempool

# View primary wallet
$ bcash wallet get

# View transaction history
$ bcash wallet history

# Send a transaction
$ bcash wallet send [address] 0.01

# View balance
$ bcash wallet balance

# Derive new address
$ bcash wallet address

# Create a new account
$ bcash wallet account create foo

# Send from account
$ bcash wallet send [address] 0.01 --account=foo
```

RPC examples:

``` bash
$ bcash rpc getblockchaininfo
$ bcash rpc getwalletinfo
$ bcash rpc getpeerinfo
$ bcash rpc getbalance
$ bcash rpc listtransactions
$ bcash rpc sendtoaddress [address] 0.01
```

## Commands

bcoin-cli commands are split into 3 categories: cli, rpc, and wallet.

### Top-level Commands

- `info`: Get server info.
- `wallets`: List all wallets.
- `wallet create [id]`: Create wallet.
- `broadcast [tx-hex]`: Broadcast transaction.
- `mempool`: Get mempool snapshot.
- `tx [hash/address]`: View transactions.
- `coin [hash+index/address]`: View coins.
- `block [hash/height]`: View block.
- `rescan [height]`: Rescan for transactions.
- `reset [height/hash]`: Reset chain to desired block.
- `resend`: Resend pending transactions.
- `backup [path]`: Backup the wallet db.
- `wallet [command]`: Execute wallet command.
- `rpc [command] [args]`: Execute RPC command.

### Wallet Commands

- `listen`: Listen for events.
- `get`: View wallet.
- `master`: View wallet master key.
- `shared add [xpubkey]`: Add key to wallet.
- `shared remove [xpubkey]`: Remove key from wallet.
- `balance`: Get wallet balance.
- `history`: View TX history.
- `pending`: View pending TXs.
- `coins`: View wallet coins.
- `account list`: List account names.
- `account create [account-name]`: Create account.
- `account get [account-name]`: Get account details.
- `address`: Derive new receiving address.
- `change`: Derive new change address.
- `retoken`: Create new api key.
- `send [address] [value]`: Send transaction.
- `mktx [address] [value]`: Create transaction.
- `sign [tx-hex]`: Sign transaction.
- `zap [age?]`: Zap pending wallet TXs.
- `tx [hash]`: View transaction details.
- `blocks`: List wallet blocks.
- `block [height]`: View wallet block.
- `view [tx-hex]`: Parse and view transaction.
- `import [wif|hex]`: Import private or public key.
- `watch [address]`: Import an address.
- `key [address]`: Get wallet key by address.
- `dump [address]`: Get wallet key WIF by address.
- `lock`: Lock wallet.
- `unlock [passphrase] [timeout?]`: Unlock wallet.
- `resend`: Resend pending transactions.

### RPC Commands

Bcash implements nearly all bitcoind calls along with some custom calls.

- `stop`
- `help`
- `getblockchaininfo`
- `getbestblockhash`
- `getblockcount`
- `getblock`
- `getblockhash`
- `getblockheader`
- `getchaintips`
- `getdifficulty`
- `getmempoolancestors`
- `getmempooldescendants`
- `getmempoolentry`
- `getmempoolinfo`
- `getrawmempool`
- `gettxout`
- `gettxoutsetinfo`
- `verifychain`
- `invalidateblock`
- `reconsiderblock`
- `getnetworkhashps`
- `getmininginfo`
- `prioritisetransaction`
- `getwork`
- `getworklp`
- `getblocktemplate`
- `submitblock`
- `setgenerate`
- `getgenerate`
- `generate`
- `generatetoaddress`
- `estimatefee`
- `estimatepriority`
- `estimatesmartfee`
- `estimatesmartpriority`
- `getinfo`
- `validateaddress`
- `createmultisig`
- `verifymessage`
- `signmessagewithprivkey`
- `setmocktime`
- `getconnectioncount`
- `ping`
- `getpeerinfo`
- `addnode`
- `disconnectnode`
- `getaddednodeinfo`
- `getnettotals`
- `getnetworkinfo`
- `setban`
- `listbanned`
- `clearbanned`
- `getrawtransaction`
- `createrawtransaction`
- `decoderawtransaction`
- `decodescript`
- `sendrawtransaction`
- `signrawtransaction`
- `gettxoutproof`
- `verifytxoutproof`
- `fundrawtransaction`
- `resendwallettransactions`
- `abandontransaction`
- `addmultisigaddress`
- `backupwallet`
- `dumpprivkey`
- `dumpwallet`
- `encryptwallet`
- `getaccountaddress`
- `getaccount`
- `getaddressesbyaccount`
- `getbalance`
- `getnewaddress`
- `getrawchangeaddress`
- `getreceivedbyaccount`
- `getreceivedbyaddress`
- `gettransaction`
- `getunconfirmedbalance`
- `getwalletinfo`
- `importprivkey`
- `importwallet`
- `importaddress`
- `importprunedfunds`
- `importpubkey`
- `keypoolrefill`
- `listaccounts`
- `listaddressgroupings`
- `listlockunspent`
- `listreceivedbyaccount`
- `listreceivedbyaddress`
- `listsinceblock`
- `listtransactions`
- `listunspent`
- `lockunspent`
- `move`
- `sendfrom`
- `sendmany`
- `sendtoaddress`
- `setaccount`
- `settxfee`
- `signmessage`
- `walletlock`
- `walletpassphrasechange`
- `walletpassphrase`
- `removeprunedfunds`
- `getmemory`
- `selectwallet`
- `setloglevel`
