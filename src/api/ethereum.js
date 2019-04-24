function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

export async function sign(w3, address, message) {
  console.log(1)
  let buffer = get_verification_buffer(message)
  console.log(2)
  let signed = await w3.eth.personal.sign(buffer.toString(), address, '')
  //let signed = await ethereum.eth.sign(address, buffer.toString('UTF-8'))
  // let signed = w3.currentProvider.sendAsync({
  //   id: 1,
  //   method: 'personal_sign',
  //   params: [address, buffer.toString()]
  // })
  console.log(3)
  console.log(signed)
  message.signature = signed
  return message
}
