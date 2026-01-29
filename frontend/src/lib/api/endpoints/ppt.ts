/**
 * PPT API endpoints
 */

import { API_V1_URL } from '../config';

export function getPPTDownloadUrl(songId: string): string {
  return `${API_V1_URL}/ppt/generate?song=${encodeURIComponent(songId)}`;
}

export async function downloadPPT(songId: string): Promise<void> {
  const url = getPPTDownloadUrl(songId);
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
