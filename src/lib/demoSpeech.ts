// Demo speech data for testing the analysis feature
export interface DemoSpeech {
  id: string;
  title: string;
  topic: string;
  key_message: string;
  audience_demographics: string;
  speaker_background: string;
  duration_minutes: number;
  tone: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const DEMO_SPEECHES: DemoSpeech[] = [
  {
    id: "demo-speech-001",
    title: "The Power of Vulnerability",
    topic: "Personal Growth & Emotional Intelligence",
    key_message: "Vulnerability is not weakness; it's our greatest measure of courage.",
    audience_demographics: "General audience, professionals, and anyone interested in personal development and authentic living.",
    speaker_background: "Researcher and storyteller with over a decade of studying human connection, courage, and shame. Published author on topics of vulnerability and wholehearted living.",
    duration_minutes: 18,
    tone: "inspiring",
    content: `Good morning. When I was a young researcher, a research professor at the University of Houston, I received a research grant to study vulnerability.

And that research changed everything I thought I knew about courage, vulnerability, and connection. I'll share what I learned.

I started by asking people about connection. What I learned was that connection is why we're here. It's what gives purpose and meaning to our lives.

When I asked people about love, they told me about heartbreak. When I asked people about belonging, they told me their most excruciating experiences of being excluded. When I asked people about connection, the stories they told me were about disconnection.

So I started to look at the research on connection. What I learned was that the people who have a strong sense of love and belonging believe they're worthy of love and belonging.

The one thing that keeps us out of connection is our fear that we're not worthy of connection. But here's what's interesting: people who have a strong sense of love and belonging also have a deep sense of courage.

Courage, the original definition of courage, when it first came into the English language—it's from the Latin word cor, meaning "heart"—and the original definition was to tell the story of who you are with your whole heart.

And these people have something in common: they fully embrace vulnerability. They believe that what made them vulnerable made them beautiful. They don't talk about vulnerability being comfortable, nor do they talk about it being excruciating—as I had heard earlier. They just talk about it being necessary.

They talk about the willingness to say "I love you" first. The willingness to do something where there are no guarantees. The willingness to breathe through waiting for the doctor to call after your mammogram. They're willing to invest in a relationship that may or may not work out.

They thought this was fundamental: vulnerability is not weakness. Let me say that again: vulnerability is weakness. Vulnerability is our most accurate measurement of courage—to be vulnerable, to let ourselves be seen, to be honest.

One of the things that I think is important is this: we cannot selectively numb emotion. You can't numb those hard feelings without numbing the other affects, our emotions. You cannot selectively numb. So when we numb those, we numb joy, we numb gratitude, we numb happiness.

And then we are miserable, and we are looking for purpose and meaning, and then we feel vulnerable, so then we have a couple of beers and a banana nut muffin. And it becomes this dangerous cycle.

One of the things that we need to think about is why and how we numb. And it doesn't have to be addiction. The other thing we do is we make everything that's uncertain certain. Religion has gone from a belief in faith and mystery to certainty. "I'm right, you're wrong. Shut up." That's it. Just certain.

The more afraid we are, the more vulnerable we are, the more afraid we are. This is what politics looks like today. There's no discourse anymore. There's no conversation. There's just blame. You know how blame is described in the research? A way to discharge pain and discomfort.

We're so desperate to be certain, and we're so uncomfortable with vulnerability. But here's the truth: vulnerability is the birthplace of innovation, creativity, and change.

I want to talk to you about what I learned about how we think about ourselves. I learned about how we think about ourselves from the research. When I would ask people about connection, they would tell me about disconnection.

And the one thing that keeps us out of connection is our fear that we're not worthy of connection. But here's what's interesting: people who have a strong sense of love and belonging believe they're worthy of love and belonging.

So I think the bottom line is this: we're hardwired for connection. It's what gives purpose and meaning to our lives. And the path to connection is vulnerability.

And here's what I learned: we need to let ourselves be seen, deeply seen, vulnerably seen. We need to love with our whole hearts, even though there's no guarantee. We need to practice gratitude and joy in those moments of terror, when we're wondering, "Can I love you this much? Can I believe in this this passionately? Can I be this fierce about this?"

The truth is, vulnerability is the core of all emotions and feelings. To feel is to be vulnerable. To believe vulnerability is weakness is to believe that feeling is weakness.

And so we need to stop numbing. We need to start being vulnerable. We need to start letting ourselves be seen. Because when we work from a place that says, "I'm enough," then we stop screaming and start listening. We're kinder and gentler to the people around us, and we're kinder and gentler to ourselves.

That's what I learned. And what I learned is this: the people who have a strong sense of love and belonging believe they're worthy of love and belonging. And that's the difference.

Thank you.`,
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper function to get a demo speech by ID
export function getDemoSpeech(id: string): DemoSpeech | undefined {
  return DEMO_SPEECHES.find((speech) => speech.id === id);
}

// For backward compatibility
export const DEMO_SPEECH = DEMO_SPEECHES[0];

