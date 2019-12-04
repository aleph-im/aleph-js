import { encrypt as ecies_encrypt, decrypt as ecies_decrypt } from 'eciesjs'

export function decrypt(account, content, { as_hex = true, as_string = true } = {}) {
  if (as_hex)
    content = Buffer.from(content, 'hex')
  else
    content = Buffer.from(content)

  let result = ecies_decrypt(account['private_key'], content)
  if (as_string)
    result = result.toString()
  return result
}

export function encrypt_for_self(account, content, { as_hex = true, as_string = true } = {}) {
  return encrypt(account['public_key'], content, {'as_hex': as_hex, 'as_string': as_string})
}

export function encrypt(
  target_publickey, encrypted_content, { as_hex = true, as_string = true } = {}) {
  
  if (as_string)
    encrypted_content = Buffer.from(encrypted_content)

  let result = ecies_encrypt(target_publickey, encrypted_content)
  if (as_hex)
    result = result.toString('hex')

  return result
}