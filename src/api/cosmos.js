import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

import * as crypto from "@cosmjs/crypto";

const launchpad = require("@cosmjs/launchpad")
const secp256k1 = require('secp256k1')

function get_verification_inner_string(message) {
  // Returns a serialized string to verify the message integrity
  return `${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`
}

function get_signable_message(message) {
    signable = get_verification_inner_string(message)
    content_message = {
        "type": "signutil/MsgSignText",
        "value": {
            "message": signable,
            "signer": message['sender'],
        }
    }
    
    return {
        "chain_id": "signed-message-v1",
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


function sortedObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortedObject);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result = sortedKeys.reduce(
    (accumulator, key) => ({
      ...accumulator,
      [key]: sortedObject(obj[key]),
    }),
    {},
  );
  return result
}

/** Returns a JSON string with objects sorted by key */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function sortedJsonStringify(obj) {
  return JSON.stringify(sortedObject(obj))
}

function serializeSignDoc(signDoc) {
  return toUtf8(sortedJsonStringify(signDoc))
}

export async function sign_with_key(private_key, signable) {
  const message = new crypto.Sha256(launchpad.serializeSignDoc(signable)).digest();
  const signature = await crypto.Secp256k1.createSignature(
    message, Buffer.from(private_key, 'hex'))
  const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
  return {
    signed: signDoc,
    signature: launchpad.encodeSecp256k1Signature(this.pubkey, signatureBytes),
  }
}

export async function sign(account, message) {
  let signable = get_signable_message(message)
  if (account.source == 'integrated') {
    let signature = await sign_with_key(account.private_key, message)
    message['signature'] = JSON.stringify(signature['signatures'])
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
  private_key = null, mnemonics = null, path = "m/44'/118'/0'/0/0", prefx = "cosmos",
  name = null} = {}){
  
  let wallet = null
  let prv = null

  if (mnemonics) {
    const mnemonicChecked = new EnglishMnemonic(mnemonics)
    const seed = await crypto.Bip39.mnemonicToSeed(mnemonicChecked)
    let { nprv } = crypto.Slip10.derivePath(Slip10Curve.Secp256k1, seed, path)
    prv = nprv
  } else {
    prv = Buffer.from(private_key, 'hex')
  }


  const uncompressed = (await Secp256k1.makeKeypair(privkey)).pubkey
  const address = crypto.rawSecp256k1PubkeyToAddress(
    uncompressed, prefix)


  let account = {
    'private_key': private_key.toString('hex'),
    'public_key': uncompressed.toString('hex'),
    'mnemonics': mnemonics,
    'address': address,
    'prefix': prefix,
    'path': path,
    'type': 'CSDK',
    'source': 'integrated'
  }

  if (name)
    account['name'] = name
  else
    account['name'] = account['address']

  return account
}