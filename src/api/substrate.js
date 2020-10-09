import * as bip39 from 'bip39'

import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto'

function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

export async function sign(account, message) {
  let buffer = get_verification_buffer(message)
  let signer = account.signer
  console.log(signer)
  if (!(signer&&signer.sign)) {
    let keyring = new Keyring({ type: 'sr25519' })
    if (account.mnemonics) {
      signer = keyring.createFromUri(account.mnemonics, { name: 'sr25519' })
    } else if (account.private_key) {
      signer = keyring.createFromUri(account.private_key, { name: 'sr25519' })
    }
  }
  console.log(signer)
  if (signer) {
    console.log(signer.sign(buffer))
    let signed = "0x" + Buffer.from(signer.sign(buffer)).toString('hex')
    let signate_object = JSON.stringify({
      'curve': 'sr25519',
      'data': signed
    })
    message.signature = signate_object
    return message
  }
}

export async function new_account({format = 42} = {}) {
  let mnemonics = mnemonicGenerate()
  return import_account({
    'mnemonics': mnemonics,
    'format': format
  })
}

export async function import_account({
  private_key = null, mnemonics = null, format=42,
  name = null} = {}){

  await cryptoWaitReady()

  let keyring = new Keyring({ type: 'sr25519' })
  keyring.setSS58Format(format)
  
  let pair = null

  if (mnemonics) {
    pair = keyring.createFromUri(mnemonics, { name: 'sr25519' })
  } else if (private_key !== null) {
    pair = keyring.createFromUri(private_key, { name: 'sr25519' })
  }

  let account = {
    'keyring': keyring,
    'private_key': pair.secretKey,
    'public_key': pair.publicKey,
    'mnemonics': mnemonics,
    'address': pair.address,
    'address_format': format,
    'type': 'DOT',
    'source': 'integrated',
    'signer': pair
  }
  if (name)
    account['name'] = name
  else
    account['name'] = account['address']
  
  return account
}