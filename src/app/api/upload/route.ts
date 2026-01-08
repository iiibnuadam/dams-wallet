import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate user here if needed
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'application/pdf'],
          tokenPayload: JSON.stringify({
            // optional payload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: Save to DB here if you want server-side confirmation
        console.log('blob uploaded', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
