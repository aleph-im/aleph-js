import axios from 'axios'
import {ipfs_push} from './create'
import {DEFAULT_SERVER} from './base'
import {sign_and_broadcast, put_content} from './create'
const shajs = require('sha.js')

export async function get_posts(
  types, {
    api_server = DEFAULT_SERVER, pagination = 200, page=1,
    refs = null, addresses = null, tags = null, hashes = null} = {}) {
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

export async function submit(
  address, post_type, content, {
    api_server = DEFAULT_SERVER, ref = null, chain = null, channel = null,
    inline = true, storage_engine='storage', account = null} = {}) {
  let post_content = {
    'type': post_type,
    'address': address,
    'content': content,
    'time': Date.now() / 1000
  }

  if (ref !== null)
    post_content['ref'] = ref

  let message = {
    'chain': chain,
    'channel': channel,
    'sender': address,
    'type': 'POST',
    'time': Date.now() / 1000
  }
  await put_content(message, post_content, inline, storage_engine, api_server)

  await sign_and_broadcast(message, account, api_server)
  return message
}
