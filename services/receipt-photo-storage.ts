import { Directory, File, Paths } from 'expo-file-system';

const RECEIPTS_DIR_NAME = 'receipt-photos';

function getReceiptsDirectory(): Directory {
  const directory = new Directory(Paths.document, RECEIPTS_DIR_NAME);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

function getExtension(uri: string): string {
  const match = /\.(\w+)$/.exec(uri);
  return match ? match[1] : 'jpg';
}

/**
 * ImagePickerが返す一時URIの写真を、アプリの永続領域（Document Directory）にコピーする。
 * 保存に成功した場合は永続URIを、失敗した場合はnullを返す。
 */
export async function saveReceiptPhoto(sourceUri: string): Promise<string | null> {
  try {
    const directory = getReceiptsDirectory();
    const fileName = `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${getExtension(sourceUri)}`;

    const sourceFile = new File(sourceUri);
    const destinationFile = new File(directory, fileName);
    sourceFile.copy(destinationFile);

    return destinationFile.uri;
  } catch (error) {
    console.warn('[receipt-photo-storage] 写真の保存に失敗しました', error);
    return null;
  }
}

/** 永続領域に保存済みの写真を削除する。存在しない場合も何もしない。 */
export function deleteReceiptPhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('[receipt-photo-storage] 写真の削除に失敗しました', error);
  }
}
