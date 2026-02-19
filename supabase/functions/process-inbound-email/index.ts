
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req: Request) => {
    try {
        const payload = await req.json()
        console.log('Incoming payload:', JSON.stringify(payload, null, 2))

        // CloudMailin puede enviar los datos en diferentes estructuras dependiendo del formato seleccionado
        const from = payload.headers?.from || payload.from
        const subject = payload.headers?.subject || payload.subject
        const body = payload.plain || payload.body || payload.text

        if (!from || !body) {
            console.error('Validation failed. From:', from, 'Body length:', body?.length)
            return new Response(JSON.stringify({
                error: 'Missing from or body',
                received: { from: !!from, body: !!body }
            }), { status: 400 })
        }

        // Limpiar "Nombre <email@gmail.com>" -> "email@gmail.com"
        const cleanFrom = from.includes('<') ? from.match(/<([^>]+)>/)?.[1] : from;
        console.log('Cleaned email from:', cleanFrom)

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Identificar al usuario
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', cleanFrom)
            .single()

        if (profileError || !profile) {
            console.error('User not found:', from)
            return new Response(JSON.stringify({ error: 'User not registered' }), { status: 404 })
        }

        // 2. Llamar a Gemini para parsear el contenido
        const prompt = `
      Eres un asistente experto en viajes. Analiza este correo electrónico.
      
      PASO 1: Determina si el correo es una confirmación de reserva, itinerario, ticket o información relevante para UN VIAJE (vuelos, hoteles, trenes, actividades, alquiler de autos, etc).
      Si NO es relacionado a un viaje, responde unicamente: { "is_relevant": false }
      
      PASO 2: Si SÍ es relacionado a un viaje, extrae la información en este formato JSON:
      {
        "is_relevant": true,
        "type": "Flight" | "Hotel" | "Activity" | "Restaurant" | "Transport" | "Idea",
        "title": "Un título corto y descriptivo",
        "description": "Resumen de lo más importante",
        "start_time": "ISO8601 string",
        "end_time": "ISO8601 string o null",
        "location": { "name": "Nombre del lugar", "address": "Dirección completa" },
        "cost": numero o null,
        "currency": "USD" | "ARS" | etc,
        "booking_reference": "Código de reserva o null"
      }

      Cuerpo del correo:
      Asunto: ${subject}
      Contenido: ${body}
    `

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })

        const geminiData = await geminiRes.json()

        if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('Invalid Gemini response structure')
            return new Response(JSON.stringify({ error: 'Gemini failed to generate a valid response' }), { status: 500 })
        }

        // Limpiar posibles bloques de código Markdown (```json ... ```)
        const rawText = geminiData.candidates[0].content.parts[0].text
        const cleanJson = rawText.replace(/```json|```/g, "").trim()
        const parsedResult = JSON.parse(cleanJson)

        // 3. Si no es relevante, terminar aquí con éxito para que GAS marque el mail como procesado
        if (parsedResult.is_relevant === false) {
            return new Response(JSON.stringify({ success: true, ignored: true }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            })
        }

        // 4. Guardar en inbox_items
        const { error: insertError } = await supabase
            .from('inbox_items')
            .insert({
                user_id: profile.id,
                type: parsedResult.type,
                title: parsedResult.title,
                description: parsedResult.description,
                start_time: parsedResult.start_time,
                end_time: parsedResult.end_time,
                location: parsedResult.location,
                booking_reference: parsedResult.booking_reference,
                raw_content: body
            })

        if (insertError) throw insertError

        return new Response(JSON.stringify({ success: true, item: parsedResult }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error('Error processing email:', error)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
    }
})
