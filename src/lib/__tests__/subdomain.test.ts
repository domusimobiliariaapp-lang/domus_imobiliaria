import { describe, it, expect } from 'vitest'
import { extractSubdomain } from '../subdomain'

describe('extractSubdomain', () => {
  it('retorna null para localhost simples', () => {
    expect(extractSubdomain('localhost')).toBeNull()
    expect(extractSubdomain('127.0.0.1')).toBeNull()
  })

  it('extrai subdomínio em desenvolvimento local (*.localhost)', () => {
    expect(extractSubdomain('aurora.localhost')).toBe('aurora')
    expect(extractSubdomain('domus.localhost')).toBe('domus')
    expect(extractSubdomain('imobiliaria-sp.localhost')).toBe('imobiliaria-sp')
  })

  it('ignora subdomínios reservados em *.localhost', () => {
    expect(extractSubdomain('www.localhost')).toBeNull()
    expect(extractSubdomain('app.localhost')).toBeNull()
    expect(extractSubdomain('dev.localhost')).toBeNull()
    expect(extractSubdomain('api.localhost')).toBeNull()
  })

  it('retorna null para domínio principal em produção', () => {
    expect(extractSubdomain('gestaodomus.com.br')).toBeNull()
    expect(extractSubdomain('www.gestaodomus.com.br')).toBeNull()
    expect(extractSubdomain('domus.com.br')).toBeNull()
    expect(extractSubdomain('www.domus.com.br')).toBeNull()
    expect(extractSubdomain('domusapp.com')).toBeNull()
    expect(extractSubdomain('www.domusapp.com')).toBeNull()
  })

  it('extrai subdomínio de organização em domínio de produção brasileiro (.com.br)', () => {
    expect(extractSubdomain('aurora.gestaodomus.com.br')).toBe('aurora')
    expect(extractSubdomain('prime.gestaodomus.com.br')).toBe('prime')
    expect(extractSubdomain('imob-nova.gestaodomus.com.br')).toBe('imob-nova')
    expect(extractSubdomain('aurora.domus.com.br')).toBe('aurora')
  })

  it('ignora subdomínios de sistema reservados em produção', () => {
    expect(extractSubdomain('app.gestaodomus.com.br')).toBeNull()
    expect(extractSubdomain('api.gestaodomus.com.br')).toBeNull()
    expect(extractSubdomain('dev.gestaodomus.com.br')).toBeNull()
    expect(extractSubdomain('staging.gestaodomus.com.br')).toBeNull()
    expect(extractSubdomain('admin.gestaodomus.com.br')).toBeNull()
    expect(extractSubdomain('portal.gestaodomus.com.br')).toBeNull()
  })
})
