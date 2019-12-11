const secp256k1 = require('secp256k1')
const RIPEMD160 = require('ripemd160')
const bs58 = require('bs58')
const shajs = require('sha.js')
import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

var hexRegEx = /([0-9]|[a-f])/gim

function isHex (input) {
  return typeof input === 'string' &&
    (input.match(hexRegEx) || []).length === input.length
}

function getxor (body) {
  // my current/simple method
  // assume 'buf1', 'buf2' & 'result' are ArrayBuffers
  let xor = 0
  for (var i = 0; i < body.length; i++) {
    xor = xor ^ body[i]
  }
  return xor
}

export function write_with_length (val, buf, cursor) {
  let llen = write_varint(val.length, buf, cursor)
  let slen = val.copy(buf, cursor + llen)
  return llen + slen
}

export function write_varint (value, buf, cursor) {
  let len = 1
  if (value < 253) {
    // ob = new Buffer.from([self.value]);
    buf[cursor] = value
  } else if (value <= 0xFFFF) {
    // ob = new Buffer.allocUnsafe(3);
    buf[cursor] = 253
    buf.writeUIntLE(value, cursor + 1, 2)
    len = 3
  } else if (value <= 0xFFFFFFFF) {
    buf[cursor] = 254
    buf.writeUIntLE(value, cursor + 1, 4)
    len = 5
  } else {
    throw "not implemented"
  }
  return len
}

export function private_key_to_public_key (prv) {
  return secp256k1.publicKeyCreate(prv)
}

export function public_key_to_hash (pub, { chain_id = 1, address_type = 1 } = {}) {
  let sha = new shajs.sha256().update(pub).digest()
  let pubkeyHash = new RIPEMD160().update(sha).digest()
  let output = Buffer.allocUnsafe(3)
  output.writeInt16LE(chain_id, 0)
  output.writeInt8(address_type, 2)
  return Buffer.concat([output, pubkeyHash]) //.toString('hex')
}

export function address_from_hash (hash, { prefix = 'NULS' } = {}) {
  //const bytes = Buffer.from(hash, 'hex')
  const address = bs58.encode(Buffer.concat([hash, new Buffer([getxor(hash)])]))
  return prefix + String.fromCharCode(prefix.length+96) + address
}

export function hash_twice (buffer) {
  let sha =  new shajs.sha256().update(buffer).digest()
  sha =  new shajs.sha256().update(sha).digest()
  return sha;
}

export function hash_from_address (address) {
  let hash = bs58.decode(address)
  return hash.slice(0, hash.length - 1) //.toString('hex')
}


function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

function magic_hash(message, messagePrefix) {
  messagePrefix = messagePrefix || '\u0018NULS Signed Message:\n'
  if (!Buffer.isBuffer(messagePrefix)) messagePrefix = Buffer.from(messagePrefix)

  //var messageVISize = varuint.encodingLength(message.length)
  var buffer = Buffer.allocUnsafe(messagePrefix.length + 6 + message.length)
  var cursor = messagePrefix.copy(buffer, 0)
  cursor += write_varint(message.length, buffer, cursor)
  cursor += Buffer.from(message).copy(buffer, cursor)
  buffer = buffer.slice(0, cursor)
  return new shajs.sha256().update(buffer).digest()
}


function encodeSignature (signature, recovery, compressed) {
  if (compressed) recovery += 4
  return Buffer.concat([Buffer.alloc(1, recovery + 27), signature])
}  

export function sign(prv_key, message) {
  let digest = magic_hash(get_verification_buffer(message))

  if (typeof prv_key === 'string' || prv_key instanceof String)
    prv_key = Buffer.from(prv_key, 'hex')

  const sigObj = secp256k1.sign(digest, prv_key)
  let signature = encodeSignature(
    sigObj.signature,
    sigObj.recovery,
    false
  )
  message.signature = signature.toString('base64')
  return message

  //   let pub_key = secp256k1.publicKeyCreate(prv_`key)

  //   let sigObj = secp256k1.sign(digest, prv_key)
  //   let signed = secp256k1.signatureExport(sigObj.signature)

  //   let buf = Buffer.alloc(3 + pub_key.length + signed.length)
  //   let cursor = write_with_length(pub_key, buf, 0)
  //   cursor += 1 // we let a zero there for alg ECC type
  //   cursor += write_with_length(signed, buf, cursor)

  //   message.signature = buf.toString('hex')`
}

export function check_pkey(private_key) {
  if (!isHex(private_key)) { return false }
  if (!private_key) { return false }
  if ((private_key.length === 66) && (private_key.substring(0, 2) === '00')) {
    private_key = private_key.substring(2, 66)
  }
  if (private_key.length !== 64) { return false }
  try {
    let prvbuffer = Buffer.from(private_key, 'hex')
    let pub = private_key_to_public_key(prvbuffer)
  } catch (e) {
    return false
  }
  return private_key
}

export async function new_account({chain_id = 1, prefix='NULS'} = {}) {
  let mnemonics =  bip39.generateMnemonic()
  return import_account({
    'mnemonics': mnemonics,
    'chain_id': chain_id,
    'prefix': prefix
  })
}

export async function import_account({
  private_key = null, mnemonics = null, chain_id = 1, prefix = 'NULS',
  name = null} = {}){
    
  if (mnemonics) {
    let v = await bip39.mnemonicToSeed(mnemonics)
    let b = bip32.fromSeed(v)
    private_key = b.privateKey.toString('hex')
  }
  if (private_key !== null) {
    let account = {
      'private_key': private_key,
      'mnemonics': mnemonics,
      'type': 'NULS2'
    }
    let prvbuffer = Buffer.from(private_key, 'hex')
    let pub = private_key_to_public_key(prvbuffer)
    account['public_key'] = pub.toString('hex')
    let hash = public_key_to_hash(pub, {
      'chain_id': chain_id
    })
    account['address'] = address_from_hash(hash, {
      'prefix': prefix
    })
    if (name)
      account['name'] = name
    else
      account['name'] = account['address']

    return account
  }
  return null
}