import { Keypair } from '@solana/web3.js'
import nacl from 'tweetnacl';
import * as bip39 from 'bip39'
import base58 from 'bs58'

const ethers = require('ethers')

function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

export async function provider_sign(provider, message) {
  let buffer = get_verification_buffer(message)
  let signature;
  if (typeof(provider.signTransaction) === 'function') {
    signature = await provider.request({
        method: "signMessage",
        params: {
            message: buffer
        }
    })
  }
  else if (typeof(provider._sendRequest) === 'function') {
      try {
        signature = await provider._sendRequest('signTransaction', {
            message: base58.encode(buffer)
          })
          if (!signature) {
              throw new Error('JSONRPC method not implemented')
          }
      } catch (error) {
          console.log(error)
      }
  }
  else{
      throw new Error('Provider has no signing method')
  }
  return JSON.stringify({
    signature: signature.signature,
    publicKey: provider.publicKey.toString()
  })
}

export async function pkey_sign(secretKey, address, message) {
  let buffer = get_verification_buffer(message)
  const signature = nacl.sign.detached(buffer, base58.decode(secretKey))
  return JSON.stringify({
    'signature': base58.encode(signature),
    publicKey: address
  })
}

export async function sign(account, message) {
  let buffer = get_verification_buffer(message)
  let signed = null
  if (account.private_key) {
    signed = await pkey_sign(account.private_key, account.address, message)
  } else if (account.provider) {
    signed = await provider_sign(account.provider, message)
  }

  message.signature = signed
  return message
}

export async function new_account({path = "m/44'/60'/0'/0/0"} = {}) {
  let account = new Keypair()
  console.log(account)
  return import_account({
    'private_key': base58.encode(account.secretKey)
  })
}


async function _from_wallet(wallet, name) {
  if (wallet) {
    let account = {
      'private_key': base58.encode(wallet.secretKey),
      'public_key': wallet.publicKey.toString(),
      'address': wallet.publicKey.toString(),
      'type': 'SOL',
      'source': 'integrated',
      'signer': wallet
    }
    if (name)
      account['name'] = name
    else
      account['name'] = account['address']

    return account
  }
  return null
}

export async function import_account({
  private_key = null, name = null} = {}){
  
  let wallet = null
  if (private_key !== null) {
    wallet = Keypair.fromSecretKey(base58.decode(private_key))
  }
  return await _from_wallet(wallet, name)
}

export async function from_provider(provider) {
  // You should likely pass Wallet from '@project-serum/sol-wallet-adapter'
  return {
    'private_key': null,
    'public_key': provider.publicKey.toString(),
    'address': provider.publicKey.toString(),
    'name': provider.publicKey.toString(),
    'type': 'SOL',
    'source': 'provider',
    'provider': provider
  }
}