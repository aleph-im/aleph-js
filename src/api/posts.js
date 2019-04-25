import axios from 'axios'
import {ipfs_push} from './create'
import {DEFAULT_SERVER} from './base'

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

export async function create_post (address, post_type, content,
                                   {api_server = DEFAULT_SERVER,
                                    ref = null, misc_content = null,
                                    chain = "NULS",
                                    channel = null} = {}) {
  let post_content = {
    'type': post_type,
    'address': address,
    'content': {
      'body': content
    },
    'time': Date.now() / 1000
  }

  if (ref !== null) {
    post_content.ref = ref
  }
  if (misc_content !== null) {
    Object.assign(post_content.content, misc_content);
  }

  let hash = await ipfs_push(post_content, {'api_server':api_server})

  let message = {
    'item_hash': hash,
    'chain': chain,
    'channel': channel,
    'sender': address,
    'type': 'POST',
    'time': Date.now() / 1000
  }
  return message
}
