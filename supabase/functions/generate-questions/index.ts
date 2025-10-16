const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate philosophical questions for the topic
    const questions = generatePhilosophicalQuestions(topic);

    return new Response(
      JSON.stringify({ questions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePhilosophicalQuestions(topic: string): string[] {
  const templates = [
    `What are the fundamental ethical implications of ${topic}?`,
    `How does ${topic} challenge our understanding of human nature?`,
    `Can ${topic} exist without power structures, or is it inherently hierarchical?`,
    `What historical precedents inform our current understanding of ${topic}?`,
    `Is ${topic} a social construct, or does it reflect deeper truths about reality?`,
    `How might ${topic} evolve in the next generation, and what does that reveal about us?`,
    `What uncomfortable truths about ${topic} are we collectively avoiding?`,
    `Does ${topic} ultimately liberate or constrain individual autonomy?`,
    `How do different philosophical frameworks interpret ${topic} differently?`,
    `What role does power play in shaping our discourse around ${topic}?`
  ];

  // Shuffle and return 7-8 questions
  const shuffled = templates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 7);
}
