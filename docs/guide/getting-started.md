---
sidebarDepth: 2
---

# Getting Started

## Accounts

To interact (write to it) with the aleph.im network, you will need an account.
There are several account providers supported, among those:

- NULS2
- Ethereum (private key in browser, or web3)

### NULS

To create a new account (if you don't use an external provider), you need to call the `new_account` function of the needed chain. Arguments to this function vary per chain.

``` javascript
import { nuls2 } from 'aleph-js'

await nuls2.new_account()
```

The account is an object having a `type` (which type of account is it), an `address`, a `public_key` and a few other fields(`private_key`), needed by the signing and encryption modules later on. The `mnemonics` here is used to reconstruct the `private_key`.

Example:

``` javascript
// WARNING: do not use this example key!
{
  private_key:  'cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c',
  mnemonics: 'cool install source weather mass material hope inflict nerve evil swing swamp',
  type: 'NULS2',
  public_key: '02a7e23f579821364bf186b2ee0fb2aa9e5faa57cd4f281599ca242d8d9faa8533',
  address: 'NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf',
  name: 'NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf'
}
```

To use an existing account, from private key or mnemonics, call the `import_account` function. The passed arguments depends on the account type.

Those calls load the same example account we created earlier:

``` javascript
import { nuls2 } from 'aleph-js'

// WARNING: do not use this example key!
// From mnemonics:
account = await nuls2.import_account({mnemonics: 'cool install source weather mass material hope inflict nerve evil swing swamp'})
// From private key:
account = nuls2.import_account({private_key: 'cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c'})
```

### Ethereum

Same for Ethereum:

``` javascript
import { ethereum } from 'aleph-js'

// to create a new account
await ethereum.new_account()
// to import an account from mnemonics
await ethereum.import_account({mnemonics: '...'})
// you can specify a derivation path for the mnemonics (also works on new_account, default is m/44'/60'/0'/0/0)
await ethereum.import_account({mnemonics: '...', path: "m/44'/60'/0'/0/0"})
// to import an account from private key
await ethereum.import_account({private_key: '...'})
```

A specificity of ethereum is the ability to use 3rd party providers, here an example with metamask-like browser web3 providers:
``` javascript
let account = null
if (window.ethereum) {
    try {
        // Request account access if needed
        await window.ethereum.enable()
        account = await ethereum.from_provider(window['ethereum'] || window.web3.currentProvider)
    } catch (error) {
        // User denied account access...
    }
}
```


Due to this specificity, three other keys are added to the account object in ethereum:
- `signer`,
- `source` (that can be either `integrated` for a local private key or `provider`),
- and `provider`

You would need to remove them (beside source) to be able to serialize the account (for storage for example).

### NEO

**New in version 0.1.2, encryption supported from 0.2.0**

NEO addresses currently don't support mnemonics in the API, you need to either provide a `private_key` or a `WIF` (recommended).

Features are similar:

``` javascript
import { neo } from 'aleph-js'

// to create a new account
await neo.new_account()
// to import an account from WIF
await neo.import_account({wif: '...'})
// to import an account from private key
await neo.import_account({private_key: '...'})
```

Due to the specific elliptic curve used by NEO (SECP256R1 instead of SECP256K1 on NULS and Ethereum), please be specific when using encryption, passing the `secp256r1` curve argument). Please also take the different curve into account when verifying signatures or content sent by NEO addresses.

## Aggregates (key-value storage)

The aggregate function is a per-address key-value storage.
Keys are strings, values are nested objects (dictionnaries or hash-tables).

When you create an AGGREGATE message, you mutate the value of a specific key. Data is added as layers, only changing sub keys that are defined.

Example of calls:

``` javascript
import { aggregates } from 'aleph-js'

// We update the 'mykey' key:
await aggregates.submit(account.address, 'mykey', {'a': 1, 'b': 2}, {'account': account, 'channel': 'TEST'})

// Let's ask for it
await aggregates.fetch_one(account.address, 'mykey')
// >> { 'a': 1, 'b': 2 }

// Now let's ask for all keys for our account:
await aggregates.fetch(account.address)
// >> { 'mykey': { 'a': 1, 'b': 2 } }

// We update it again with a new subkey
await aggregates.submit(account.address, 'mykey', {'a': 3, 'c': 5}, {'account': account, 'channel': 'TEST'})

// Now let's ask for all keys for our account again:
await aggregates.fetch(account.address)
// >> { mykey: { a: 3, b: 2, c: 5 } }
// b stayed the same as we didn't touch it...

// Adding a new key:
await aggregates.submit(account.address, 'mynewkey', {'foo': 'bar'}, {'account': account, 'channel': 'TEST'})

await aggregates.fetch(account.address)
// >> { mynewkey: { foo: 'bar' }, mykey: { a: 3, b: 2, c: 5 } }
```

Worth noting, all these commands accept an `options` object, with `api_server` being configurable:

```javascript
await aggregates.submit(account.address, 'mykey', {'a': 1, 'b': 2}, {'account': account, 'channel': 'TEST', api_server: 'https://api2.aleph.im'})


// Let's ask for new data on both API servers (api2 and default -api1-):
await aggregates.fetch(account.address, {api_server: 'https://api2.aleph.im'})
// >> { mynewkey: { foo: 'bar' }, mykey: { a: 3, b: 2, c: 5, d: 10 } }

await aggregates.fetch(account.address)
// >> { mynewkey: { foo: 'bar' }, mykey: { a: 3, b: 2, c: 5, d: 10 } }
```

`aggregates.submit` function signature:
```javascript
async function submit(
  address, // sending address
  key, // the key to mutate
  content, // content to be applied
  {
    chain=null, // the message chain, optional if an account is provided
    channel=null, // the channel on which to write
    api_server = DEFAULT_SERVER, // target API server
    inline = true, // should the message be stored as a separate file or inserted inline
    storage_engine='storage', // storage engine to use, 'storage' or 'ipfs'
    account = null // account that should be used to sign, optional
    // (but needed if you actually want to send the message, without it it's a "dry run"!)
  } = {}) {
```

`aggregates.fetch` function signature:
```javascript
async function fetch(
    address,
    {keys = null, api_server = DEFAULT_SERVER} = {}) {
```

## Posts (document-like storage)

Posts are unique documents, posted in a certain channel and for a certain type. 

They can have a `ref`, which is searcheable. This reference is useful for a few things things:

- To reference another document (as a comment for example)
- To reference something else (an address, a transaction hash, a location ID, whatever), to specify this post is about it
- To reference another document to amend it. This specific case is interesting, if you post with type `amend` and another post has in the `ref` field, all new occurence of the original post (granted you are authorized to do it) will be shown with new content, like an "amend and replace". (it is useful to edit content).

### Creation

To submit a post, it needs an `address` (most likely your account address), a `type` (keep it simple and lowercase: `blog`, `chat`, `comment`, etc...) a `content`, which is arbitrary (but an object), an an options object with the same options as the others:

```javascript
import { posts } from 'aleph-js'

await posts.submit(
    account.address, 'mytype',
    {'body': 'test'},
    {'account': account,
     'channel': 'TEST',
     api_server: 'https://api2.aleph.im'})
// { chain: 'NULS2',
//   channel: 'TEST',
//   sender: 'NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf',
//   type: 'POST',
//   time: 1582555614.466,
//   item_type: 'inline',
//   item_content:
//    '{"type":"mytype","address":"NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf","content":{"body":"test"},"time":1582555614.466}',
//   item_hash:
//    'b546f70573a1a91a35a39dbacea0bbfe50847337dcbd995323994535847a6519',
//   signature:
//    'HGnCVb6Rnck5l/BfP93zR3/dvgVToK1yRiPTQrCZjKA/eMiUZwMkaSQFb/FMLvENTtZX804KRERGZxoxU1lEip0=' }
```

For full reference here is the `posts.submit` function signature:
```javascript
async function submit(
  address, post_type, content,
  {
    api_server = DEFAULT_SERVER, // target API server
    ref = null, // ref field of the message, optionnal
    chain = null, // the message chain, optional if an account is provided
    channel = null, // the channel on which to write
    inline = true, // should the message be stored as a separate file or inserted inline
    // data that could fall under GDPR, set it to false
    storage_engine = 'storage', // storage engine to use, 'storage' or 'ipfs'
    account = null // account that should be used to sign, optional
    // (but needed if you actually want to send the message, without it it's a "dry run"!)
  } = {}) {
```

### Query

Now let's ask for all posts sent with 'mytype' `type` (luckily there is only one right now):

```javascript
let result = await posts.get_posts('mytype')
// { posts:
//    [ list ],
//   pagination_page: 1,
//   pagination_total: 1,
//   pagination_per_page: 200,
//   pagination_item: 'posts' }

result.posts[0].content
// >> { body: 'test' }
```

Inside this list, each post is layout like this:
```javascript
{ _id: { '$oid': '5e53e1deeecd5271f209dbd7' },
  chain: 'NULS2',
  item_hash:
   'b546f70573a1a91a35a39dbacea0bbfe50847337dcbd995323994535847a6519',
  sender: 'NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf',
  type: 'mytype',
  channel: 'TEST',
  confirmed: true,
  content: { body: 'test' },
  item_content:
   '{"type":"mytype","address":"NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf","content":{"body":"test"},"time":1582555614.466}',
  item_type: 'inline',
  signature:
   'HGnCVb6Rnck5l/BfP93zR3/dvgVToK1yRiPTQrCZjKA/eMiUZwMkaSQFb/FMLvENTtZX804KRERGZxoxU1lEip0=',
  size: 115,
  time: 1582555614.466,
  confirmations: [ { chain: 'ETH', height: 6027674, hash: [Object] } ],
  original_item_hash:
   'b546f70573a1a91a35a39dbacea0bbfe50847337dcbd995323994535847a6519',
  original_signature:
   'HGnCVb6Rnck5l/BfP93zR3/dvgVToK1yRiPTQrCZjKA/eMiUZwMkaSQFb/FMLvENTtZX804KRERGZxoxU1lEip0=',
  original_type: 'mytype',
  hash:
   'b546f70573a1a91a35a39dbacea0bbfe50847337dcbd995323994535847a6519',
  address: 'NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf' }
```

To simplify, and avoid having a message.content.content, in posts retrieval APIs, the message and first level are merged, leaving only a `content` field that is your content. The `original_` fields are here in case you did an amend.

For full reference here is the `posts.get_posts` function signature:
```javascript
async function get_posts(
  types, // a string, if you want more than one type, separate with commas
  {
    api_server = DEFAULT_SERVER,
    pagination = 200, // Total per page
    page = 1, // requested page
    refs = null, // a list of references, optional
    addresses = null, // a list of addresses posting the items, optional
    tags = null, // a list of tags, optional
    hashes = null // a list of actual original hashes, optional (useful to request a specific item)
  } = {}) {
```

### Amends (editing posts)

To amend the post we created earlier, we submit a new one with type `amend` and the former `item_hash` as `ref`:
```javascript
await posts.submit(
    account.address, 'amend',
    {'body': 'amended test'},
    {'ref': 'b546f70573a1a91a35a39dbacea0bbfe50847337dcbd995323994535847a6519',
     'account': account,
     'channel': 'TEST',
     api_server: 'https://api2.aleph.im'})

let result = await posts.get_posts(
    'mytype',
    {'hashes': [ // let's filter to find only our post
        'b546f70573a1a91a35a39dbacea0bbfe50847337dcbd995323994535847a6519'
    ]})
result.posts[0].content
// >> { body: 'amended test' }
```



## Store (File/Blob storage)

To store a file, you need to create a STORE message, that you can reference later on from AGGREGATEs or POSTs (to add meta-data, allowing amends and things like that):

### Storing files

Let's try with a very simple text file (you can do bigger files yourself later!).

```javascript
import { store } from 'aleph-js'

// Worth noting that this file object can also be obtained from an upload form input (if you don't want to build it programmatically).
var myfile = new File(
    ["This is just a test."],
    "test.txt",
    {type: "text/plain"})
await store.submit(
    account.address,
    {'fileobject': myfile,
     'account': account,
     'channel': 'TEST',
     'api_server': 'https://api2.aleph.im' // please select an API server accepting files, this one does!
    })
```

Here is what the returned object looks like:
```javascript
{
  "chain": "NULS2",
  "channel": "TEST",
  "sender": "NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf",
  "type": "STORE",
  "time": 1582562109.316,
  "item_type": "inline",
  "item_content": "{\"address\":\"NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf\",\"item_type\":\"storage\",\"item_hash\":\"11dfc1e6953dac4bd02d8faa06878f51eea3421fa58d7148e808d425cff2a921\",\"time\":1582562109.316}",
  "item_hash": "fde8effa834d12ce127e7f82ac317639505af36b34b3b40a2d108b9e1bfb3b2b",
  "signature": "HLzL+XlkNkCOo8UReVo7Qh3mMzVn5/imD9J5xbzBejS4b9BjKDTiGfcnhJQPGd47lcmPg3jtBcVOTPNSPVwb3Ws=",
  "content": {
    "address": "NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf",
    "item_type": "storage",
    "item_hash": "11dfc1e6953dac4bd02d8faa06878f51eea3421fa58d7148e808d425cff2a921",
    "time": 1582562109.316
  }
}
```

The interesting part here is `content.item_hash`, it can be used to retrieve our stored object, via a direct url (replace the API server by any API server accepting files):
[https://api2.aleph.im/api/v0/storage/raw/HASH](https://api2.aleph.im/api/v0/storage/raw/11dfc1e6953dac4bd02d8faa06878f51eea3421fa58d7148e808d425cff2a921)

Let's try again with IPFS storage this time:
```javascript
var msg = await store.submit(
    account.address,
    {'fileobject': myfile,
     'account': account,
     'channel': 'TEST',
     'storage_engine': 'ipfs',
     'api_server': 'https://api2.aleph.im' // please select an API server accepting files, this one does!
    })
msg.content.item_hash
// => QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L
```

This time we have two urls at our disposal: the [internal one](https://api2.aleph.im/api/v0/storage/raw/QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L), and the [ipfs one](https://ipfs.io/ipfs/QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L).


::: tip

It's worth noting that you can use it to pin an existing IPFS hash that you stored by yourself, by using `storage_engine: 'ipfs', file_hash: 'myhash'` in options.

:::

For full reference here is the `storage.submit` function signature:
```javascript
async function submit(
  address,
  {
    file_hash = null, // if you hashed (and sent/provided!) the item yourself already
    fileobject = null, // or a fileobject (from a form, or built yourself) directly
    storage_engine = 'storage', // the storage engine
    // can be 'storage' for aleph.im built-in or 'ipfs' for an ipfs compatible storage
    chain = null, // the message chain, optional if an account is provided
    channel = null, // the channel on which to write
    storage_engine = 'storage', // storage engine to use, 'storage' or 'ipfs'
    api_server = DEFAULT_SERVER, // target API server
    account = null // account that should be used to sign
  } = {}) {
```

### Retrieving files

You can either use the URIs defined earlier directly, or use the API to get the file content as a Buffer:

```javascript
await store.retrieve(
    '11dfc1e6953dac4bd02d8faa06878f51eea3421fa58d7148e808d425cff2a921',
    {api_server: 'https://api2.aleph.im'}
)
// => <Buffer 54 68 69 73 20 69 73 20 6a 75 73 74 20 61 20 74 65 73 74 2e>

var my_buffer = await store.retrieve(
    'QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L',
    {api_server: 'https://api2.aleph.im'}
)
// => <Buffer 54 68 69 73 20 69 73 20 6a 75 73 74 20 61 20 74 65 73 74 2e>
```

This buffer can easily be converted back to a string:
```javascript
my_buffer.toString('utf8')
// => 'This is just a test.'
```

## Encryption

Warning: methods in this module are now asynchronous since v0.2.

Encryption in aleph.im uses the [ECIES standard](https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme), using the [ECIES Js library](https://github.com/ecies/js) on SECP256K1 and a fork of [ECCrypto](https://github.com/bitchan/eccrypto) for others.

It means you encrypt for a specific public key (the receiver), and decrypt with your private key (your account), if you are said receiver.

Let's play with it:

```javascript
import { encryption } from 'aleph-js'

// Let's encrypt it for our public key (which is on NULS, so with secp256k1 curve):
await encryption.encrypt(account.public_key, "This is just a test.", {'curve': 'secp256k1'})
// The line above is equivalent to this one (this one takes an account as first parameter):
var encrypted = await encryption.encrypt_for_self(account, "This is just a test.")
// => '04b3794b53f0b58636dc547b7a1aef7b74df66fa4e8fe7302ae073149d4217a6788fe1aba0844909ab6fa9faebe87e8b4051fe16be759a650311a2616970fddb16c6bb469b22b5cdf7dd841b7e48c74df182e9d7dbaa2e9638dfb7908e954c5e09f0005f317a81ee161db7ef751387156f8ba685bf'

// Now let's decrypt it:
await encryption.decrypt(account, encrypted)
// => 'This is just a test.'
```

Those examples above work well for strings, and encode as hexadecimal.
All those methods accept a 3rd argument, `options`, with those options:
- `as_hex`: default true, takes input/output as hexadecimal for the encrypted side
- `as_string`: default true, works with strings for the clear (unencrypted) side
- `curve` (only for the encrypt function, derived from account on the others): sets the curve to encrypt for, as it can't be deducted from the public key. Supported values: `secp256k1` and `secp256r1`.

The first 2 options are useful if you want to serialize yourself, or avoid serialization, and if you are working with files (or binary blobs). 

Typically, if you want to store an encrypted file, you will handle Buffer objects, and won't serialize in any way (both options will by false).