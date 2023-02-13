import path from 'path'
import {describe, it} from 'mocha'
import {expect, use} from 'chai'
import {fetchAsText} from '@roundforest/http-commons'
import {presult} from '@roundforest/promise-commons'
import chaiSubset from 'chai-subset'
use(chaiSubset)

import {runDockerCompose, tcpHealthCheck} from '../../src/docker-compose-testkit.js'

const __filename = new URL(import.meta.url).pathname
const __dirname = path.dirname(__filename)

describe('docker-compose-testkit (integ)', function () {
  it('should work with a simple docker-compose', async () => {
    const env = {
      CONTENT_FOLDER: path.join(__dirname, 'fixtures/nginx-test-content'),
    }
    const {teardown, findAddress} = await runDockerCompose(
      path.join(__dirname, 'fixtures/docker-compose.yml'),
      {
        forceRecreate: true,
        env,
      },
    )

    const nginxAddress = await findAddress('nginx')
    const nginx2Address = await findAddress('nginx2')
    await findAddress('postgres', 5432, {healthCheck: tcpHealthCheck})

    expect(await fetchAsText(`http://${nginxAddress}`)).to.include('Welcome to nginx')
    expect(await fetchAsText(`http://${nginx2Address}`)).to.equal(
      'This content will be available if the CONTENT_FOLDER was set',
    )

    await teardown()

    const {teardown: teardown2, findAddress: findAddress2} = await runDockerCompose(
      path.join(__dirname, 'fixtures/docker-compose.yml'),
      {env},
    )

    const nginxAddress2 = await findAddress2('nginx')

    expect(nginxAddress2).to.equal(nginxAddress)

    expect(await fetchAsText(`http://${nginxAddress2}`)).to.include('Welcome to nginx')

    await teardown2()

    const {teardown: teardown3, findAddress: findAddress3} = await runDockerCompose(
      path.join(__dirname, 'fixtures/docker-compose.yml'),
      {forceRecreate: true, containerCleanup: true, env},
    )

    const nginxAddress3 = await findAddress3('nginx')

    expect(nginxAddress3).to.not.equal(nginxAddress2)

    expect(await fetchAsText(`http://${nginxAddress3}`)).to.include('Welcome to nginx')

    expect(await presult(fetchAsText(`http://${nginxAddress2}`))).to.satisfy(
      (/** @type {[any]} */ [error]) =>
        error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET',
    )

    await teardown3()

    expect(await presult(fetchAsText(`http://${nginxAddress3}`))).to.satisfy(
      (/** @type {[any]} */ [error]) =>
        error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET',
    )
  })

  it('should work with multiple docker composes in parallel', async () => {
    const {teardown: teardown1, findAddress: findAddress1} = await runDockerCompose(
      path.join(__dirname, 'fixtures/docker-compose.yml'),
      {
        forceRecreate: true,
        env: {
          CONTENT_FOLDER: path.join(__dirname, 'fixtures/nginx-test-content'),
        },
      },
    )
    const {teardown: teardown2, findAddress: findAddress2} = await runDockerCompose(
      path.join(__dirname, 'fixtures/docker-compose.yml'),
      {
        forceRecreate: true,
        env: {
          CONTENT_FOLDER: path.join(__dirname, './fixtures/nginx-test-content-2'),
        },
      },
    )
    const {teardown: teardown3, findAddress: findAddress3} = await runDockerCompose(
      path.join(__dirname, 'fixtures/docker-compose.yml'),
      {
        forceRecreate: true,
        env: {
          CONTENT_FOLDER: path.join(__dirname, 'fixtures/nginx-test-content'),
        },
        variation: '2',
      },
    )

    await findAddress1('nginx', 80)
    await findAddress2('nginx', 80)
    await findAddress3('nginx', 80)

    await teardown3()
    await teardown2()
    await teardown1()
  })

  it('should support host.docker.internal and use fetchLogs', async () => {
    const {teardown, fetchLogs} = await runDockerCompose(
      path.join(__dirname, 'fixtures/docker-compose-with-host-docker-internal.yml'),
    )

    expect(await fetchLogs('ping')).to.include('bytes from')

    await teardown()
  })
})
