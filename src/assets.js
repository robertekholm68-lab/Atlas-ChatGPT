const normalizedBase = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

export function publicAsset(path) {
  return `${normalizedBase}${path.replace(/^\//, '')}`
}

export const brandLogoUrl = publicAsset('assets/branding/logos/askr-wordmark-horizontal.png')
