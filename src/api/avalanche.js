import createHash from 'create-hash'

import { Avalanche, BinTools } from "avalanche"

function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

async function get_keychain() {
  let ava = new Avalanche()
  let xchain = ava.XChain()
  return xchain.keyChain()
}

async function get_keypair(private_key = null) {
  let keychain = await get_keychain()
  let keypair = keychain.makeKey()
  if (private_key !== null) {
    let priv = Buffer.from(private_key, 'hex')
    keypair.importKey(priv)
  }
  return keypair
}


async function digestMessage(mBuf) {
  // let mBuf = Buffer.from(msgStr, 'utf8')
  let msgSize = Buffer.alloc(4)
  let msgStr = mBuf.toString("utf-8")
  msgSize.writeUInt32BE(mBuf.length, 0)
  let msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, 'utf8')
  return createHash('sha256').update(msgBuf).digest()
}


export async function sign(account, message) {
  let buffer = get_verification_buffer(message)
  console.log(buffer)
  let bintools = BinTools.getInstance()
  let signed = null
  let keypair = null
  if ((account.signer !== undefined)&&(account.signer)) {
    keypair = account.signer
  } else  if (account.private_key) {
    keypair = await get_keypair(account.private_key)
  }

  let digest = await digestMessage(buffer)
  console.log(digest.toString())

  let digestHex = digest.toString('hex')
  let digestBuff = Buffer.from(digestHex, 'hex')
  signed = keypair.sign(digestBuff)

  signed = bintools.cb58Encode(signed)

  message.signature = signed
  console.log(message)
  return message
}


export async function new_account({} = {}) {
  return await _from_keypair(await get_keypair(null))
}


async function _from_keypair(keypair, name) {
  if (keypair) {
    let account = {
      'private_key': keypair.getPrivateKey().toString('hex'),
      'public_key': keypair.getPublicKey().toString('hex'),
      'address': keypair.getAddressString(),
      'type': 'AVAX',
      'source': 'integrated',
      'signer': keypair
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

  return await _from_keypair(await get_keypair(private_key), name)
}