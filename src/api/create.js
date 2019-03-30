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

export async function broadcast (message,
                                 {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.post(`${api_server}/api/v0/ipfs/pubsub/pub`, {
    'topic': 'ALEPH-TEST',
    'data': JSON.stringify(message)
  })
  return response.data.value;
}
