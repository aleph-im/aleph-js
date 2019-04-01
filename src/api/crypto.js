const secp256k1 = require('secp256k1')
const RIPEMD160 = require('ripemd160')
const bs58 = require('bs58')
const shajs = require('sha.js')

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

export function public_key_to_hash (pub, { chain_id = 8964, address_type = 1 } = {}) {
  let sha = new shajs.sha256().update(pub).digest()
  let pubkeyHash = new RIPEMD160().update(sha).digest()
  let output = Buffer.allocUnsafe(3)
  output.writeInt16LE(chain_id, 0)
  output.writeInt8(address_type, 2)
  return Buffer.concat([output, pubkeyHash]) //.toString('hex')
}

export function address_from_hash (hash) {
  //const bytes = Buffer.from(hash, 'hex')
  const address = bs58.encode(Buffer.concat([hash, new Buffer([getxor(hash)])]))
  return address
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

function nuls_magic_hash(message, messagePrefix) {
  messagePrefix = messagePrefix || '\u0018NULS Signed Message:\n'
  if (!Buffer.isBuffer(messagePrefix)) messagePrefix = Buffer.from(messagePrefix)

  //var messageVISize = varuint.encodingLength(message.length)
  var buffer = Buffer.allocUnsafe(messagePrefix.length + 6 + message.length)
  var cursor = messagePrefix.copy(buffer, 0)
  cursor += write_varint(message.length, buffer, cursor)
  cursor += Buffer.from(message).copy(buffer, cursor)
  buffer = buffer.slice(0, cursor)
  console.log(buffer.toString('utf8'))
  return new shajs.sha256().update(buffer).digest()
}

export function nuls_sign(prv_key, message) {
  let digest = nuls_magic_hash(get_verification_buffer(message))

  let pub_key = secp256k1.publicKeyCreate(prv_key)

  let sigObj = secp256k1.sign(digest, prv_key)
  let signed = secp256k1.signatureExport(sigObj.signature)

  let buf = Buffer.alloc(3 + pub_key.length + signed.length)
  let cursor = write_with_length(pub_key, buf, 0)
  cursor += 1 // we let a zero there for alg ECC type
  cursor += write_with_length(signed, buf, cursor)

  message.signature = buf.toString('hex')
  return message
}

export function check_nuls_pkey(private_key) {
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
