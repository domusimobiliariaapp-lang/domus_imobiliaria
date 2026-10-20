/**
 * Busca de endereço por CEP.
 *
 * Extraída do PropertyModal: o modal de imóveis e o de configurações da
 * empresa precisam do mesmo comportamento, e duas cópias divergem com o tempo —
 * foi o que aconteceu enquanto a lógica vivia só dentro do modal.
 *
 * Ordem dos provedores: BrasilAPI primeiro, ViaCEP como reserva. A BrasilAPI
 * devolve também as coordenadas, que o mapa do modal de imóveis usa para se
 * posicionar; o ViaCEP devolve `erro: true` emCEP inexistente em vez de 404,
 * o que é tratado logo abaixo.
 */

export interface CepAddress {
  street: string
  neighborhood: string
  city: string
  state: string
  latitude: number | null
  longitude: number | null
}

/** CEP precisa de 8 dígitos. Qualquer outra coisa retorna null sem buscar. */
export function normalizeCep(cep: string): string | null {
  const digits = cep.replace(/\D/g, '')
  return digits.length === 8 ? digits : null
}

/**
 * Busca o endereço de um CEP. Lança em CEP não encontrado ou em falha de rede
 * — quem chama decide a mensagem, porque o texto difere entre o mapa do imóvel
 * e a tela de configurações.
 */
export async function lookupCep(cep: string): Promise<CepAddress> {
  const digits = normalizeCep(cep)
  if (!digits) throw new Error('CEP inválido')

  // O .catch mantém a reserva quando a BrasilAPI está fora do ar: sem ele, uma
  // falha de rede encerraria a busca em vez de tentar o outro provedor.
  const brasilResponse = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`).catch(() => null)

  let data: {
    street?: string
    neighborhood?: string
    city?: string
    state?: string
    location?: { coordinates?: { latitude?: string; longitude?: string } }
  }

  if (brasilResponse?.ok) {
    data = await brasilResponse.json()
  } else {
    const viaResponse = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!viaResponse.ok) throw new Error('CEP não encontrado')
    const via = await viaResponse.json()
    if (via.erro) throw new Error('CEP não encontrado')
    data = { street: via.logradouro, neighborhood: via.bairro, city: via.localidade, state: via.uf }
  }

  const latitude = Number(data.location?.coordinates?.latitude)
  const longitude = Number(data.location?.coordinates?.longitude)
  // Null Island (0,0) é o que a BrasilAPI devolve quando não tem coordenada —
  // centralizaria o mapa no Atlântico, no meio do nada.
  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0

  return {
    street: data.street || '',
    neighborhood: data.neighborhood || '',
    city: data.city || '',
    state: data.state?.toUpperCase() || '',
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
  }
}
