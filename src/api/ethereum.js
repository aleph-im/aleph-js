import * as bip39 from 'bip39'
const ethers = require('ethers')

function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

export async function w3_sign(w3, address, message) {
  let buffer = get_verification_buffer(message)
  let signed = await w3.eth.personal.sign(buffer.toString(), address, '')
  message.signature = signed
  return message
}

export async function sign(account, message) {
  let buffer = get_verification_buffer(message)
  let signer = account.signer
  if (!signer) {
    if (account.private_key) {
      signer = ethers.Wallet(account.private_key)
    }
  }
  if (signer) {
    let signed = await signer.signMessage(buffer.toString())
    message.signature = signed
    return message
  }
}

export async function new_account({path = "m/44'/60'/0'/0/0"} = {}) {
  let mnemonics = bip39.generateMnemonic()
  return import_account({
    'mnemonics': mnemonics,
    'path': path
  })
}

async function _from_wallet(wallet) {
  if (wallet) {
    let account = {
      'private_key': wallet.privateKey,
      'mnemonics': wallet.mnemonic,
      'address': wallet.address,
      'type': 'ETH',
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
  private_key = null, mnemonics = null, path = "m/44'/60'/0'/0/0",
  name = null} = {}){
  
  let wallet = null
  if (mnemonics) {
    wallet = ethers.Wallet.fromMnemonic(mnemonics, path)
  } else if (private_key !== null) {
    wallet = ethers.Wallet(private_key)
  }
  return await _from_wallet(wallet)
}

export async function from_provider(provider) {
  // You should likely pass web3.currentProvider
  const ethprovider = new ethers.providers.Web3Provider(provider)

  // There is only ever up to one account in MetaMask exposed
  const signer = ethprovider.getSigner()
  const address = await signer.getAddress()
  return {
    'private_key': null,
    'mnemonics': null,
    'address': address,
    'name': address,
    'type': 'ETH',
    'source': 'provider',
    'provider': ethprovider,
    'signer': signer
  }
}