import axios from 'axios'
import {ipfs_push} from './create'
import {DEFAULT_SERVER} from './base'
import * as nuls2 from './nuls2'
import {broadcast} from './create'
const shajs = require('sha.js')

export async function fetch_one(address, key, {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.get(`${api_server}/api/v0/aggregates/${address}.json?keys=${key}`)
  if ((response.data.data !== undefined) && (response.data.data[key] !== undefined))
  {
    return response.data.data[key]
  } else
    return null
}

export async function fetch(address, {keys = null, api_server = DEFAULT_SERVER} = {}) {

  if (keys !== null)
    keys = keys.join(',')

  let response = await axios.get(
    `${api_server}/api/v0/aggregates/${address}.json`,
    {
      params: {keys: keys}
    })
  if ((response.data.data !== undefined))
  {
    return response.data.data
  } else
    return null
}

export async function fetch_profile(address, {api_server = DEFAULT_SERVER} = {}) {
  return await fetch_one(address, ['profile'], {'api_server': api_server})
}

export async function submit(address, key, content,
                             {chain=null, channel=null,
                              api_server = DEFAULT_SERVER,
                              inline = true, account = null} = {}) {
                              
  let aggregate_content = {
    'address': address,
    'key': key,
    'content': content,
    'time': Date.now() / 1000
  }
  let message = {
    'chain': chain,
    'channel': channel,
    'sender': address,
    'type': 'AGGREGATE',
    'time': Date.now() / 1000
  }
  if (inline) {
    let serialized = JSON.stringify(aggregate_content)

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
