# Getting Started

## Accounts

To interact (write to it) with the aleph.im network, you will need an account.
There are several account providers supported, among those:

- NULS2
- Ethereum (private key in browser, or web3)

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