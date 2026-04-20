import { getPayload, type Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import config from '@/payload.config'

let payload: Payload

describe('Links collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('auto-generates a slug on create', async () => {
    const link = await payload.create({
      collection: 'links',
      data: { targetUrl: 'https://example.com/' },
    })

    expect(link.slug).toBeTypeOf('string')
    expect((link.slug ?? '').length).toBeGreaterThanOrEqual(7)
  })

  it('rejects invalid targetUrl', async () => {
    await expect(
      payload.create({
        collection: 'links',
        data: { targetUrl: 'not-a-url' },
      }),
    ).rejects.toThrow()
  })

  it('blocks anonymous override updates', async () => {
    const link = await payload.create({
      collection: 'links',
      data: { targetUrl: 'https://example.com/blocked' },
    })

    await expect(
      payload.update({
        collection: 'links',
        id: link.id,
        data: { override: { title: 'Hacked' } },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
