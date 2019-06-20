function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

export async function sign(w3, address, message) {
  let buffer = get_verification_buffer(message)
  let signed = await w3.eth.personal.sign(buffer.toString(), address, '')
  message.signature = signed
  return message
}
