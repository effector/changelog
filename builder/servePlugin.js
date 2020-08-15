import {promises as fs} from 'fs'
import {createServer as createHttpsServer} from 'https'
import {createServer} from 'http'
import {resolve} from 'path'

import mime from 'mime'
import opener from 'opener'

let server = globalThis.server
let clients = globalThis.clients

/**
 * Serve your rolled up bundle like webpack-dev-server
 * @param {ServeOptions|string|string[]} options
 */
export function serve(options = {contentBase: ''}) {
  if (Array.isArray(options) || typeof options === 'string') {
    options = {contentBase: options}
  }
  options.contentBase = Array.isArray(options.contentBase)
    ? options.contentBase
    : [options.contentBase || '']

  mime.default_type = 'text/plain'

  const {
    contentBase,
    port = 10001,
    headers = {},
    https = false,
    openPage = '',
    mimeTypes,
    historyApiFallback,
    verbose,
    open,
    host,
    livereload
  } = options
  let livereloadUrl = '/live'
  if (livereload && typeof livereload === 'string') {
    livereloadUrl = livereload
  }
  const fallbackPath =
    typeof historyApiFallback === 'string' ? historyApiFallback : '/index.html'
  if (mimeTypes) {
    mime.define(mimeTypes, true)
  }
  const liveClients = []
  async function requestListener(request, response) {
    // Remove querystring
    const urlPath = decodeURI(request.url.split('?')[0])
    if (livereload && urlPath === livereloadUrl) {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache'
      })
      response.write(`data: ${JSON.stringify({message: 'connected'})}\n\n`)
      liveClients.push({req: request, res: response})
      request.on('close', () => {
        const index = liveClients.findIndex(({req}) => req === request)
        if (index !== -1) {
          liveClients.splice(index, 1)
        }
      })
      return
    }
    for (const key in headers) {
      response.setHeader(key, headers[key])
    }
    let lastFilePath
    let err
    for (const base of contentBase) {
      const filePath = getFilePath(base, urlPath)
      try {
        const content = await fs.readFile(filePath)
        found(response, filePath, content)
        return
      } catch (error) {
        err = error
      }
      lastFilePath = filePath
    }
    if (err.code !== 'ENOENT') {
      response.writeHead(500)
      response.end(
        `500 Internal Server Error

${filePath}

${Object.values(error).join('\n')}

(servePlugin)`,
        'utf-8'
      )
      return
    }
    if (historyApiFallback) {
      for (const base of contentBase) {
        const filePath = getFilePath(base, fallbackPath)
        try {
          const content = await fs.readFile(filePath)
          found(response, filePath, content)
          return
        } catch (error) {}
        lastFilePath = filePath
      }
    }
    notFound(response, lastFilePath)
    return
  }
  if (!server) closeServerOnTermination()
  const srv = https
    ? createHttpsServer(https, requestListener)
    : createServer(requestListener)
  srv.on('error', err => {
    console.log('server error', err)
  })
  if (server && server.listening) {
    const oldServer = server
    Promise.all(
      clients.map(
        ({res}) =>
          new Promise(rs => {
            res.end(
              `data: ${JSON.stringify({message: 'reload server'})}\n\n`,
              rs
            )
          })
      )
    ).then(() => {
      oldServer.close(err => {
        if (err) {
          console.log('error during server close')
          console.log(err)
        }
        srv.listen(port, host)
      })
    })
  } else {
    srv.listen(port, host)
  }
  globalThis.server = server = srv
  globalThis.clients = clients = liveClients

  let running = verbose === false
  const serverUrl =
    (https ? 'https' : 'http') + '://' + (host || 'localhost') + ':' + port
  return {
    name: 'serve',
    generateBundle() {
      try {
        if (!running) {
          running = true

          contentBase.forEach(base => {
            console.log(green(serverUrl) + ' -> ' + resolve(base))
          })

          if (open) {
            if (/https?:\/\/.+/.test(openPage)) {
              opener(openPage)
            } else {
              opener(serverUrl + openPage)
            }
          }
        }
        liveClients.forEach(({res}) => {
          res.write(`data: ${JSON.stringify({message: 'reload'})}\n\n`)
        })
      } catch (err) {
        console.error(err)
      }
    },
    intro() {
      if (!livereload) return
      return `;(() => {
  let reloadOnConnect = false
  try {
    const events = new EventSource('${serverUrl}${livereloadUrl}')
    events.onmessage = event => {
      let message
      try {
        const parsedData = JSON.parse(event.data)
        message = parsedData.message
      } catch (err) {}
      switch (message) {
        case 'reload':
          window.location.reload()
          break
        case 'reload server':
          reloadOnConnect = true
          break
        case 'connected':
          if (reloadOnConnect) {
            events.close()
            window.location.reload()
          }
          break
      }
    }
  } catch (err) {
    console.error('livereload failed')
    console.error(err)
  }
})();`
    }
  }
}

function getFilePath(contentBase, urlPath) {
  let filePath = resolve(contentBase || '.', '.' + urlPath)

  // Load index.html in directories
  if (urlPath.endsWith('/')) {
    filePath = resolve(filePath, 'index.html')
  }
  return filePath
}

function notFound(response, filePath) {
  response.writeHead(404)
  response.end(
    `404 Not Found

${filePath}

(servePlugin)`,
    'utf-8'
  )
}

function found(response, filePath, content) {
  response.writeHead(200, {'Content-Type': mime.getType(filePath)})
  response.end(content, 'utf-8')
}

function green(text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination() {
  ;['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'].forEach(signal => {
    process.on(signal, () => {
      if (server) {
        server.close()
        process.exit()
      }
    })
  })
}

/**
 * @typedef {Object} ServeOptions
 * @property {boolean} [open=false] Launch in browser (default: `false`)
 * @property {string} [openPage=''] Page to navigate to when opening the browser. Will not do anything if `open` is `false`. Remember to start with a slash e.g. `'/different/page'`
 * @property {boolean} [verbose=true] Show server address in console (default: `true`)
 * @property {string|string[]} [contentBase=''] Folder(s) to serve files from
 * @property {string|boolean} [historyApiFallback] Path to fallback page. Set to `true` to return index.html (200) instead of error page (404)
 * @property {string} [host='localhost'] Server host (default: `'localhost'`)
 * @property {number} [port=10001] Server port (default: `10001`)
 * @property {ServeOptionsHttps} [https=false] By default server will be served over HTTP (https: `false`). It can optionally be served over HTTPS
 * @property {{[header:string]: string}} [headers] Set headers
 */

/**
 * @typedef {Object} ServeOptionsHttps
 * @property {string|Buffer|Buffer[]|Object[]} key
 * @property {string|Buffer|Array<string|Buffer>} cert
 * @property {string|Buffer|Array<string|Buffer>} ca
 * @see https.ServerOptions
 */
