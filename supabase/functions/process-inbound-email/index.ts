import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
    try {
        const payload = await req.json()
        const { from, subject, body, attachments } = payload

        if (!from || !body) {
            return new Response(JSON.stringify({ error: 'Missing from or body' }), { status: 400 })
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Identificar al usuario
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', from)
            .single()

        if (profileError || !profile) {
            console.error('User not found:', from)
            return new Response(JSON.stringify({ error: 'User not registered' }), { status: 404 })
        }

        // 2. Llamar a Gemini para parsear el contenido
        const prompt = `
      Eres un asistente experto en viajes. Extrae información estructurada de este correo electrónico de viaje.
      Format de salida requerido (JSON puro):
      {
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

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        })

        const geminiData = await geminiRes.json()
        const parsedItem = JSON.parse(geminiData.candidates[0].content.parts[0].text)

        // 3. Guardar en inbox_items
        const { error: insertError } = await supabase
            .from('inbox_items')
            .insert({
                user_id: profile.id,
                ...parsedItem,
                raw_content: body
            })

        if (insertError) throw insertError

        return new Response(JSON.stringify({ success: true, item: parsedItem }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error('Error processing email:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
