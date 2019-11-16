import axios from 'axios'
import {ipfs_push} from './create'
import {DEFAULT_SERVER} from './base'
import * as nuls2 from './nuls2'
import {broadcast} from './create'
const shajs = require('sha.js')

export async function get_posts(types, {api_server = DEFAULT_SERVER,
                                        pagination = 200, page=1,
                                        refs = null, addresses = null,
                                        tags = null, hashes = null} = {}) {
  let params = {
    'types': types,
    'pagination': pagination,
    'page': page
  }

  if (refs !== null)
    params.refs = refs.join(',')

  if (addresses !== null)
    params.addresses = addresses.join(',')

  if (tags !== null)
    params.tags = tags.join(',')

  if (hashes !== null)
    params.hashes = hashes.join(',')

  let response = await axios.get(`${api_server}/api/v0/posts.json`, {
    'params': params
  })
  return response.data
}

export async function submit(address, post_type, content,
                             {api_server = DEFAULT_SERVER,
                              chain = null, channel = null,
                              inline = true, account = null} = {}) {
  let post_content = {
    'type': post_type,
    'address': address,
    'content': content,
    'time': Date.now() / 1000
  }

  let message = {
    'chain': chain,
    'channel': channel,
    'sender': address,
    'type': 'POST',
    'time': Date.now() / 1000
  }

  if (inline) {
    let serialized = JSON.stringify(post_content)

    message['item_content'] = serialized
    message['item_hash'] = new shajs.sha256().update(serialized).digest('hex')
  } else {
    let hash = await ipfs_push(post_content, {api_server: api_server})
    message['item_hash'] = hash
  }

  if(account) {
    if (!message['chain']) {
      message['chain'] = account['type']
    }
    if (account.type === 'NULS2') {
      nuls2.sign(account.private_key, message)
    } else
      return message // can't sign, so can't broadcast
    await broadcast(message, {'api_server': api_server})
  }
  return message
}
