// Comprehensive list of disposable and temporary email domains
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'tempmailaddress.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'minutemailbox.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'trashmail.me',
  'fakeinbox.com',
  'mohmal.com',
  'mohmal.in',
  'mohmal.im',
  'crazymailing.com',
  'generator.email',
  'mytemp.email',
  'emailondeck.com',
  'getairmail.com',
  'inboxkitten.com',
  'tempail.com',
  'burnermail.io',
  'dropmail.me',
  'maildrop.cc',
  'harakirimail.com',
  'fakemailgenerator.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'tinati.net',
  'tempr.email',
  'discard.email',
  'spambox.us',
  'kasmail.com',
  'mailcatch.com',
  'nada.ltd',
  'getnada.com',
  'abcvg.com',
  'boximail.com',
  'clrmail.com',
  'dropmail.me',
  'incognitomail.org',
  'mail-temporaire.fr',
  'tempinbox.com',
  'zillamail.com',
  'drdrb.net',
  'mytempemail.com',
  'trash-mail.com',
  'disposablemail.com',
  'mailforspam.com',
  'guerrillamail.de',
  'spamgourmet.com',
  'owlymail.com',
  'internxt.com',
  'tempmail.plus',
  'temp-mail.io',
  'temporarymail.com',
  'crazymailing.com',
  'mailtemp.net',
  'disbox.org',
  'disbox.net',
  'mailpoof.com',
  'tmpmail.net',
  'tmpmail.org'
])

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false
  const parts = email.toLowerCase().trim().split('@')
  if (parts.length !== 2) return false
  const domain = parts[1]
  
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return true
  }

  // Check subdomains
  const domainParts = domain.split('.')
  if (domainParts.length > 2) {
    const rootDomain = domainParts.slice(-2).join('.')
    if (DISPOSABLE_EMAIL_DOMAINS.has(rootDomain)) {
      return true
    }
  }

  return false
}
