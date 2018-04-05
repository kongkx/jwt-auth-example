import { checkStatus, parseJSON } from 'fetch-helpers';

export function request(url, options) {
  return fetch(url, options)
    .then(checkStatus)
    .then(parseJSON);
}
