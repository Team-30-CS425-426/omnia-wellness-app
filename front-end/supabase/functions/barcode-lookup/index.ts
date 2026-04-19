import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req: Request) => {
  try {
    const body = await req.json();

    const response = await fetch('http://146.190.145.95:3000/fatsecret/barcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': Deno.env.get('INTERNAL_PROXY_TOKEN') || '',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});