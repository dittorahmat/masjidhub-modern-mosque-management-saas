/**
 * Cloudinary API helpers for media transformation and uploads
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

/**
 * Generates an optimized Cloudinary URL with transformations
 * Pola: f_auto (format), q_auto (quality), w_auto/limit
 */
export function getOptimizedImageUrl(publicId: string, cloudName: string, watermarkText?: string) {
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const transformations = ['f_auto', 'q_auto', 'w_1200', 'c_limit'];
  
  if (watermarkText) {
    // Add text watermark overlay (simple example)
    const encodedText = encodeURIComponent(watermarkText);
    transformations.push(`l_text:Arial_40_bold:${encodedText},g_south_east,x_20,y_20,o_50`);
  }
  
  return `${baseUrl}/${transformations.join(',')}/${publicId}`;
}

/**
 * Generates a Finance Infographic URL using Cloudinary Text Overlays
 * Ini "melukis" data saldo di atas template gambar
 */
export function generateFinanceInfographicUrl(
  cloudName: string, 
  mosqueName: string, 
  balance: number, 
  date: string
) {
  const templateId = 'masjidhub/finance_template'; // Assume this exists in Cloudinary
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  
  const mosqueText = `l_text:Arial_60_bold:${encodeURIComponent(mosqueName)},g_north,y_100`;
  const balanceText = `l_text:Arial_120_bold:Rp ${balance.toLocaleString('id-ID')},g_center`;
  const dateText = `l_text:Arial_40:${encodeURIComponent(date)},g_south,y_100`;
  
  return `${baseUrl}/${mosqueText}/${balanceText}/${dateText}/${templateId}`;
}
