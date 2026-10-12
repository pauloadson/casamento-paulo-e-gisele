/**
 * Utilitário para geração de Payload PIX (BR Code / Padrão EMVCo do Banco Central do Brasil)
 * Compatível com todos os aplicativos de bancos (Nubank, Itaú, Bradesco, Banco do Brasil, Inter, etc.)
 */

// Remove acentos e caracteres especiais incompatíveis com a norma EMV do Banco Central
export function sanitizePixText(text: string, maxLength: number): string {
  if (!text) return '';
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos (acentos)
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove caracteres especiais
    .trim();
  return normalized.substring(0, maxLength);
}

// Formata a chave PIX de acordo com o tipo
export function formatPixKey(key: string, type?: string): string {
  if (!key) return '';
  const cleanKey = key.trim();

  // Telefone: deve estar no formato internacional (+55XXXXXXXXXXX)
  if (type === 'phone' || /^\+?\d{10,13}$/.test(cleanKey.replace(/\D/g, ''))) {
    const numbersOnly = cleanKey.replace(/\D/g, '');
    if (numbersOnly.length === 10 || numbersOnly.length === 11) {
      return `+55${numbersOnly}`;
    }
    if (numbersOnly.startsWith('55') && (numbersOnly.length === 12 || numbersOnly.length === 13)) {
      return `+${numbersOnly}`;
    }
  }

  // CPF / CNPJ: deve conter apenas dígitos
  if (type === 'cpf' || /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cleanKey)) {
    return cleanKey.replace(/\D/g, '');
  }

  return cleanKey;
}

// Monta um campo no formato TLV (Tag-Length-Value)
function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// Cálculo do CRC-16 CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
export function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadOptions {
  pixKey: string;
  pixKeyType?: string;
  recipientName: string;
  city: string;
  amount?: number;
  description?: string;
  txId?: string;
}

/**
 * Gera a string do PIX Copia e Cola no padrão oficial do Banco Central
 */
export function generatePixPayload(options: PixPayloadOptions): string {
  const {
    pixKey,
    pixKeyType,
    recipientName,
    city,
    amount,
    description,
    txId = '***',
  } = options;

  const formattedKey = formatPixKey(pixKey, pixKeyType);
  const sanitizedName = sanitizePixText(recipientName || 'RECEBEDOR', 25) || 'RECEBEDOR';
  const sanitizedCity = sanitizePixText(city || 'CIDADE', 15) || 'CIDADE';

  // ID 00: Payload Format Indicator (01)
  let payload = formatTLV('00', '01');

  // ID 26: Merchant Account Information (br.gov.bcb.pix + chave)
  let merchantAccount = formatTLV('00', 'br.gov.bcb.pix');
  merchantAccount += formatTLV('01', formattedKey);
  if (description) {
    const sanitizedDesc = sanitizePixText(description, 25);
    if (sanitizedDesc) {
      merchantAccount += formatTLV('02', sanitizedDesc);
    }
  }
  payload += formatTLV('26', merchantAccount);

  // ID 52: Merchant Category Code (0000)
  payload += formatTLV('52', '0000');

  // ID 53: Transaction Currency (986 = BRL)
  payload += formatTLV('53', '986');

  // ID 54: Transaction Amount (opcional, formatado com 2 casas)
  if (amount && amount > 0) {
    payload += formatTLV('54', amount.toFixed(2));
  }

  // ID 58: Country Code (BR)
  payload += formatTLV('58', 'BR');

  // ID 59: Merchant Name (máx 25 chars)
  payload += formatTLV('59', sanitizedName);

  // ID 60: Merchant City (máx 15 chars)
  payload += formatTLV('60', sanitizedCity);

  // ID 62: Additional Data Field Template (txId)
  const sanitizedTxId = sanitizePixText(txId, 25) || '***';
  const additionalData = formatTLV('05', sanitizedTxId);
  payload += formatTLV('62', additionalData);

  // ID 63: CRC16 Checksum
  const payloadToCrc = `${payload}6304`;
  const checksum = calculateCRC16(payloadToCrc);

  return `${payloadToCrc}${checksum}`;
}
