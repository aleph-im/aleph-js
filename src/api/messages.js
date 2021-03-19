import axios from 'axios'
import {DEFAULT_SERVER} from './base'

export async function get_messages(
    { api_server = DEFAULT_SERVER, pagination = 200, page=1,
      message_type = null, content_types = null,
      refs = null, addresses = null, tags = null, hashes = null} = {}) {
    let params = {
      'pagination': pagination,
      'page': page
    }

    if (message_type !== null)
      params.msgType = message_type
  
    if (content_types !== null)
      params.contentTypes = content_types.join(',')
  
    if (refs !== null)
      params.refs = refs.join(',')
  
    if (addresses !== null)
      params.addresses = addresses.join(',')
  
    if (tags !== null)
      params.tags = tags.join(',')
  
    if (hashes !== null)
      params.hashes = hashes.join(',')
  
    let response = await axios.get(`${api_server}/api/v0/messages.json`, {
      'params': params
    })
    return response.data
  }