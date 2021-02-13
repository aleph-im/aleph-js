import { encrypt as secp256k1_encrypt, decrypt as secp256k1_decrypt, utils } from 'eciesjs'
import { encrypt as secp256r1_encrypt, decrypt as secp256r1_decrypt } from './ecies/secp256r1.js'
import base58 from 'bs58'

function _get_curve_from_account(account) {
  let curve = "secp256k1"
  if (account['type'] == 'SOL')
    curve = "ed25519"
  return curve 
}

function _encapsulate(opts) {
  return Buffer.concat([opts.ephemPublicKey, opts.iv, opts.mac, opts.ciphertext])
}

function _decapsulate(content) {
  return {
    ephemPublicKey: content.slice(0, 65),
    iv: content.slice(65, 65+16),
    mac: content.slice(65+16, 65+48),
    ciphertext: content.slice(65+48)
  }
}

function _encapsulate_box(opts) {
  return Buffer.concat([opts.nonce, opts.ciphertext])
}

function _decapsulate_box(content) {
  return {
    nonce: content.slice(0, nacl.secretbox.nonceLength),
    ciphertext: content.slice(nacl.secretbox.nonceLength)
  }
}

export async function decrypt(account, content, { as_hex = true, as_string = true } = {}) {
  if (as_hex)
    content = Buffer.from(content, 'hex')
  else
    content = Buffer.from(content)
  
  const curve = _get_curve_from_account(account)

  let result = null
  if (curve == 'secp256k1') {
    result = secp256k1_decrypt(utils.decodeHex(account['private_key']), content)
  } else if (curve == 'secp256r1') {
    let opts = _decapsulate(content)
    result = await secp256r1_decrypt(utils.decodeHex(account['private_key']), opts)
  } else if (curve == 'ed25519') {
    let opts = _decapsulate_box(content)
    result = nacl.secretbox.open(
      opts.ciphertext,
      opts.nonce,
      base58.decode(account['private_key'])
    )
  }
  if (as_string)
    result = result.toString()
  return result
}
export async function encrypt_for_self(
  account, content,
  { as_hex = true,
    as_string = true } = {}) {
  const curve = _get_curve_from_account(account)
  return await encrypt(
    account['public_key'], content,
    {'as_hex': as_hex, 'as_string': as_string, 'curve': curve})
}

export async function encrypt(
  target_publickey, encrypted_content,
  { as_hex = true,
    as_string = true,
    curve = "secp256k1" } = {}) {
  
  if (as_string)
    encrypted_content = Buffer.from(encrypted_content)

  let result = null
  if (curve == 'secp256k1')
    result = secp256k1_encrypt(target_publickey, encrypted_content)
  else if (curve == 'secp256r1') {
    result = await secp256r1_encrypt(utils.decodeHex(target_publickey), encrypted_content)
    result = _encapsulate(result)
  } else if (curve == 'ed25519') {
    let nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    let content = nacl.secretbox(encrypted_content, nonce, base58.decode(key))
    result = _encapsulate_box({
      nonce: nonce,
      ciphertext: content
    })
  }

  if (as_hex)
    result = result.toString('hex')

  return result
}