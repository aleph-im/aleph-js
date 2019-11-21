import axios from 'axios'
import {DEFAULT_SERVER} from './base'
const shajs = require('sha.js')

export async function put_content(
  message, content, inline_requested, storage_engine, api_server) {

  let inline = inline_requested
  if (inline) {
    let serialized = JSON.stringify(content)
    if (serialized.length > 150000) {
      inline = false
    } else {
      message['item_content'] = serialized
      message['item_hash'] = new shajs.sha256().update(serialized).digest('hex')
    }
  }
  if (!inline) {
    let hash = ''
    if (storage_engine === 'ipfs') {
      hash = await ipfs_push(content, {api_server: api_server})
    } else {
      hash = await storage_push(content, {api_server: api_server})
    }
    message['item_hash'] = hash
  }
}

export async function ipfs_push (
  value, {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.post(`${api_server}/api/v0/ipfs/add_json`, value)
  if (response.data.hash !== undefined) {
    return response.data.hash
  } else {
    return null
  }
}

export async function storage_push (
  value, {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.post(`${api_server}/api/v0/storage/add_json`, value)
  if (response.data.hash !== undefined) {
    return response.data.hash
  } else {
    return null
  }
}

export async function ipfs_push_file (
  fileobject, {api_server = DEFAULT_SERVER} = {}) {
  let formData = new FormData()
  formData.append('file', fileobject)

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

export async function broadcast (
  message, {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.post(`${api_server}/api/v0/ipfs/pubsub/pub`, {
    'topic': 'ALEPH-TEST',
    'data': JSON.stringify(message)
  })
  return response.data.value
}
