// sendTransactionalEmail.ts

import fetch from 'node-fetch';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email)
    return new Response(
      JSON.stringify({
        error: 'Email is required',
      }),
    );

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_LOOPS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      transactionalId: 'clr7bil6b00r41130hjwxmcg8',
      dataVariables: {},
      attachments: [],
    }),
  };

  try {
    const response = await fetch(
      'https://app.loops.so/api/v1/transactional',
      options,
    );
    const data = await response.json();

    return new Response(
      JSON.stringify({
        data,
      }),
    );
    // biome-ignore lint: <any>
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
    );
  }
}
