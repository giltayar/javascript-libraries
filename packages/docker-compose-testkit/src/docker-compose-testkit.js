import path from 'path'
import crypto from 'crypto'
import net from 'net'
import {once} from 'events'
import retry from 'p-retry'

const dockerComposeCommand =
  (await execa('which docker-compose')) ? 'docker-compose' : 'docker compose'

/**
 *
 * @param {string} dockerComposeFile
 * @param {{
 *  containerCleanup?: boolean,
 *  forceRecreate?: boolean,
 *  env?: Record<string, string | undefined>,
 *  variation?: string
 * }} [options]
 */
export async function runDockerCompose(
  dockerComposeFile,
  {containerCleanup, forceRecreate, env, variation} = {},
) {
  const projectName = determineProjectName()
  const addresses = /**@type{Map<string, string>}*/ (new Map())
  const envForDependencies = Object.fromEntries(
    Object.values(getDependencyInformation(dockerComposeFile)).map((x) => [x.envName, x.version]),
  )
  const finalEnv = env
    ? {...envForDependencies, ...env, PATH: process.env.PATH, HOST_DOCKER_INTERNAL}
    : {...envForDependencies, PATH: process.env.PATH, HOST_DOCKER_INTERNAL}

  await setup()

  return {
    teardown,
    findAddress,
    fetchLogs,
  }

  async function setup() {
    await sh(
      `${dockerComposeCommand}  --file "${dockerComposeFile}" --project-name "${projectName}" up --detach ${
        forceRecreate ? '--force-recreate' : ''
      }`,
      {
        cwd: path.dirname(dockerComposeFile),
        env: finalEnv,
      },
    )
  }

  async function teardown() {
    if (!containerCleanup) return
    await sh(
      `${dockerComposeCommand} --file "${dockerComposeFile}" --project-name "${projectName}" down --volumes --remove-orphans`,
      {
        cwd: path.dirname(dockerComposeFile),
        env: finalEnv,
      },
    )
  }

  /**
   * @param {string} serviceName
   * @param {number} [port=80]
   * @param {{
   *  serviceIndex?: number,
   *  healthCheck?: (address: string) => Promise<void>,
   *  healthCheckTimeoutSec?: number
   * }} [options]
   * @returns {Promise<string>}
   */
  async function findAddress(
    serviceName,
    port = 80,
    {serviceIndex = 1, healthCheck = httpHealthCheck, healthCheckTimeoutSec = 60} = {},
  ) {
    const serviceKey = `${serviceName}:${port}:${serviceIndex}`
    if (addresses.has(serviceKey)) {
      return /**@type {string}*/ (addresses.get(serviceKey))
    }
    const addressOutput = await shWithOutput(
      `${dockerComposeCommand} --file "${dockerComposeFile}" --project-name "${projectName}" port --index=${serviceIndex} ${serviceName} ${port}`,
      {
        cwd: path.dirname(dockerComposeFile),
        env: finalEnv,
      },
    )
    const address = addressOutput.trim()

    await waitUntilHealthy(address, healthCheck, healthCheckTimeoutSec)

    addresses.set(serviceKey, address)

    return address
  }

  /**
   * @param {any} serviceName
   */
  async function fetchLogs(serviceName) {
    return await shWithOutput(
      `${dockerComposeCommand} --file "${dockerComposeFile}" --project-name "${projectName}" logs ${serviceName}`,
      {
        cwd: path.dirname(dockerComposeFile),
        env: finalEnv,
      },
    )
  }

  function determineProjectName() {
    const hash = crypto
      .createHash('MD5')
      .update(dockerComposeFile + (env ? JSON.stringify(env) : '') + (variation ?? ''))
      .digest('base64')

    return `dct_${hash.replaceAll('=', '').replaceAll('/', '').replaceAll('+', '')}`.toLowerCase()
  }
}

/**
 * @param {string} address
 * @param {(address: string) => Promise<void>} healthCheck
 * @param {number} healthCheckTimeoutSec
 */
async function waitUntilHealthy(address, healthCheck, healthCheckTimeoutSec) {
  await retry(async () => await healthCheck(address), {
    maxRetryTime: healthCheckTimeoutSec * 1000,
    maxTimeout: 250,
    minTimeout: 250,
    retries: 1000000,
  })
}

/**
 * @param {string} address
 */
export async function httpHealthCheck(address) {
  const response = await fetch(`http://${address}/`)

  await /**@type {Promise<Buffer>}*/ (response.arrayBuffer())
}

/**
 * @param {string} address
 */
export async function tcpHealthCheck(address) {
  const [host, port] = address.split(':')

  const socket = net.createConnection(parseInt(port, 10), host)

  await Promise.race([
    once(socket, 'connect'),
    once(socket, 'error').then(([err]) => Promise.reject(err)),
  ])

  socket.destroy()
}

/**
 *  platforms that use docker desktop are running the docker containers in a vm, so
 *  to access the host's "localhost" we need to use docker's dummy host
 *  `host.docker.internal`, which points to the host's localhost. This functions
 *  replaces the url's hostname if needed
 *
 * @param {string} url
 */
export function adjustUrlForDocker(url) {
  const urlUrl = new URL(url)
  if (HOSTS_THAT_NEED_REPLACING.has(urlUrl.hostname)) {
    urlUrl.hostname = 'host.docker.internal'
  }

  return urlUrl.href
}

const HOSTS_THAT_NEED_REPLACING = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const PLATFORMS_THAT_USE_DOCKER_DESKTOP = ['darwin', 'win32']
// https://github.com/docker/for-linux/issues/264
const HOST_DOCKER_INTERNAL = PLATFORMS_THAT_USE_DOCKER_DESKTOP.includes(process.platform)
  ? 'dummy-hostbecausewedontneedit: 127.0.0.1'
  : // https://stackoverflow.com/questions/48546124/what-is-linux-equivalent-of-host-docker-internal
    `host.docker.internal:${(
      await shWithOutput(
        `ip addr show | grep "\\binet\\b.*\\bdocker0\\b" | awk '{print $2}' | cut -d '/' -f 1`,
      )
    ).trim()}`
