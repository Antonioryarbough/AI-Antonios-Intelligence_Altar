export async function POST(req) {
  const body = await req.json()

  return Response.json({
    clone: body.clone || "default",
    bars: "Your AI clone will generate bars here."
  })
}