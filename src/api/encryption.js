import { encrypt as ecies_encrypt, decrypt as ecies_decrypt } from 'eciesjs'

export function decrypt(account, content, { as_hex = true } = {}) {
  if (as_hex)
    content = Buffer.from(content, 'hex')

  return ecies_decrypt(account['private_key'], content).toString()
}

export function encrypt_for_self(account, content, { as_hex = true } = {}) {
  return encrypt(account['public_key'], content, {'as_hex': as_hex})
}

export function encrypt(
  target_publickey, encrypted_content, { as_hex = true } = {}) {

  let result = ecies_encrypt(target_publickey, Buffer.from(encrypted_content))
  if (as_hex)
    result = result.toString('hex')

  return result
}