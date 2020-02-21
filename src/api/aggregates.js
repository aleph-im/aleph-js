import axios from 'axios'
import {ipfs_push} from './create'
import {DEFAULT_SERVER} from './base'
import {sign_and_broadcast, put_content} from './create'
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

export async function submit(
  address, key, content, {
    chain=null, channel=null, api_server = DEFAULT_SERVER,
    inline = true, storage_engine='storage', account = null} = {}) {
                              
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
  await put_content(message, aggregate_content, inline, storage_engine, api_server)

  await sign_and_broadcast(message, account, api_server)

  return message
}
