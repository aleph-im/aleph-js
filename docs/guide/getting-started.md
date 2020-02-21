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

## Aggregates (key-value storage)

## Posts (document-like storage)

## Store (File/Blob storage)

## Encryption