// S3 PUT 함수
export async function uploadToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'x-amz-acl': 'public-read',
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error('S3 upload failed')
  }
}
// 영구 URL 추출
export function getPublicImageUrl(presignedUrl: string): string {
  return presignedUrl.split('?')[0]!
}
