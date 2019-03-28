import axios from 'axios'
import {DEFAULT_SERVER} from './base'

export async function ipfs_push (value,
                                 {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.post(`${api_server}/api/v0/ipfs/add_json`, value)
  if (response.data.hash !== undefined) {
    return response.data.hash
  } else {
    return null
  }
}

export async function ipfs_push_file (fileobject,
                                      {api_server = DEFAULT_SERVER} = {}) {
  let formData = new FormData();
  formData.append('file', fileobject);

  let response = await axios.post( `${api_server}/api/v0/ipfs/add_file`,
    formData,
    {
      headers: {
          'Content-Type': 'multipart/form-data'
      }
    }
  )

  if (response.data.hash !== undefined) {
    return response.data.hash
  } else {
    return null
  }
}

export async function create_post (address, post_type, content,
                                   {api_server = DEFAULT_SERVER,
                                    ref = null, misc_content = null} = {}) {
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
    'chain': 'NULS',
    'channel': 'blogs',
    'sender': address,
    'type': 'POST',
    'time': Date.now() / 1000
  }
  return message
}

export async function broadcast (message,
                                 {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.post(`${api_server}/api/v0/ipfs/pubsub/pub`, {
    'topic': 'ALEPH-TEST',
    'data': JSON.stringify(message)
  })
  return response.data.value;
}
