import {
  requireIdentity,
  type IdentityStage,
  type VerifiedIdentity,
} from '../../cursor/identity'

export type ViewerScope = {
  ownerSub: string
  stage: IdentityStage
  identity: VerifiedIdentity
}

export async function requireViewer(
  request: Request,
): Promise<ViewerScope | Response> {
  const identity = await requireIdentity(request)
  if (identity instanceof Response) return identity
  return {
    ownerSub: identity.sub,
    stage: identity.stage,
    identity,
  }
}

export function json(
  data: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  headers.set('cache-control', 'private, no-store')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function errorJson(message: string, status: number): Response {
  return json({ error: message }, { status })
}
