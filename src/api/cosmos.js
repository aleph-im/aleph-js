import * as bip39 from 'bip39'
import cosmosjs from "@cosmostation/cosmosjs"
const secp256k1 = require('secp256k1')

const CHAIN_ID = "signed-message-v1"

function get_verification_inner_string(message) {
  // Returns a serialized string to verify the message integrity
  return `${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`
}

export function get_signable_message(message) {
    let signable = get_verification_inner_string(message)
    let content_message = {
        "type": "signutil/MsgSignText",
        "value": {
            "message": signable,
            "signer": message['sender'],
        }
    }
    
    return {
        "chain_id": CHAIN_ID,
        "account_number": "0",
        "fee": {
            "amount": [],
            "gas": "0",
        },
        "memo": "",
        "sequence": "0",
        "msgs": [content_message]
    }
}

export async function sign(account, message) {
  let signable = get_signable_message(message)
  if (account.source == 'integrated') {
    const cosmos = cosmosjs.network("...", CHAIN_ID)
    let signed = cosmos.sign(cosmos.newStdMsg(signable), Buffer.from(account.private_key, 'hex'))
    message['signature'] = JSON.stringify(signed['tx']['signatures'][0])
  }
  return message
}

export async function new_account({path = "m/44'/118'/0'/0/0", prefix = "cosmos"} = {}) {
  let mnemonics = bip39.generateMnemonic()
  return import_account({
    'mnemonics': mnemonics,
    'path': path,
    'prefix': prefix
  })
}

export function private_key_to_public_key (prv) {
  return secp256k1.publicKeyCreate(prv)
}

export async function import_account({
  mnemonics = null, path = "m/44'/118'/0'/0/0", prefix = "cosmos",
  name = null} = {}){

  const cosmos = cosmosjs.network("...", CHAIN_ID)
  cosmos.setBech32MainPrefix(prefix)
  cosmos.setPath(path)

  let private_key = cosmos.getECPairPriv(mnemonics)

  let account = {
    'private_key': private_key.toString('hex'),
    'public_key': private_key_to_public_key(private_key).toString('hex'),
    'mnemonics': mnemonics,
    'address': cosmos.getAddress(mnemonics),
    'prefix': prefix,
    'path': path,
    'type': 'CSDK',
    'source': 'integrated'
  }
  return account
}