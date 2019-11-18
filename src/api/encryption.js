import { encrypt as ecies_encrypt, decrypt as ecies_decrypt } from 'eciesjs'

export function decrypt(account, content) {
    content = Buffer.from(content, 'hex')
    return ecies_decrypt(account['private_key'], content).toString()
}

export function encrypt_for_self(account, content) {
    return encrypt(account['public_key'], content)
}

export function encrypt(target_publickey, encrypted_content) {
    return ecies_encrypt(target_publickey, Buffer.from(encrypted_content)).toString('hex')
}