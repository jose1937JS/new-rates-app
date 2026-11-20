import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Platform, Share, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { showToast } from '@/store/toastStore';

/** Copy plain text to the system clipboard and notify via Toast. */
export async function copyToClipboard(
  text: string,
  toastMessage = 'Copiado al portapapeles',
): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    if (toastMessage) {
      showToast(toastMessage, 'success');
    }
    return true;
  } catch {
    showToast('No se pudo copiar', 'error');
    return false;
  }
}

/** Open the native share dialog for plain text content. */
export async function shareTextContent(
  message: string,
  title?: string,
): Promise<boolean> {
  try {
    await Share.share(title ? { message, title } : { message });
    return true;
  } catch {
    showToast('No se pudo compartir', 'error');
    return false;
  }
}

/** Capture a View ref as a high-res PNG image and open the native share sheet. */
export async function shareViewAsImage(
  ref: RefObject<View | null>,
  dialogTitle = 'Compartir imagen',
): Promise<boolean> {
  try {
    if (!ref.current) {
      showToast('Vista no lista para capturar', 'error');
      return false;
    }

    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      showToast('Compartir archivos no disponible en este dispositivo', 'error');
      return false;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle,
      UTI: Platform.OS === 'ios' ? 'public.png' : undefined,
    });
    return true;
  } catch {
    showToast('No se pudo generar la imagen', 'error');
    return false;
  }
}

/** Generate a PDF from HTML markup and share it via the native share sheet. */
export async function sharePdfFromHtml(
  html: string,
  dialogTitle = 'Compartir PDF',
): Promise<boolean> {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      showToast('Compartir PDF no disponible en este dispositivo', 'error');
      return false;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: Platform.OS === 'ios' ? 'com.adobe.pdf' : undefined,
    });
    return true;
  } catch {
    showToast('No se pudo generar el PDF', 'error');
    return false;
  }
}
