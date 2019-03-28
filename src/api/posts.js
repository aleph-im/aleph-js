import axios from 'axios'
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
