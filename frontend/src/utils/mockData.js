export const MOCK_WORKSPACES = [
  {
    id: "genai",
    name: "GenAI Research",
    active: true,
    docsCount: 12,
    coverage: 96,
  },
  {
    id: "sysdesign",
    name: "System Design",
    active: false,
    docsCount: 8,
    coverage: 84,
  },
  {
    id: "agentic",
    name: "Agentic Design",
    active: false,
    docsCount: 15,
    coverage: 91,
  },
  {
    id: "security",
    name: "Cyber Security",
    active: false,
    docsCount: 5,
    coverage: 72,
  },
];

export const MOCK_SOURCES = [
  {
    id: 1,
    type: "PDF",
    name: "RAG Techniques.pdf",
    subtitle: "Compare hallucination reduction...",
    chunks: 153,
    status: "Ready",
  },
  {
    id: 2,
    type: "YouTube",
    name: "YouTube Transcript (Agent AI)",
    subtitle: "Overview of Agent AI frameworks...",
    chunks: 145,
    status: "Ready",
  },
  {
    id: 3,
    type: "Web URL",
    name: "LangGraph Docs",
    subtitle: "https://www.langgraph.docs/overview...",
    chunks: 158,
    status: "Ready",
  },
  {
    id: 4,
    type: "Note",
    name: "Personal hallucination ideas",
    subtitle: "Cross-encoder reranking notes...",
    chunks: 164,
    status: "Ready",
  },
];

export const MOCK_MESSAGES = [
  {
    id: 1,
    sender: "user",
    text: "Compare hallucination reduction techniques in RAG and Agentic systems, including cited examples.",
  },
  {
    id: 2,
    sender: "ai",
    text: "Hybrid search and Cross-Encoder reranking work in tandem to suppress hallucinations by filtering noise early. According to uploaded paper documentation, agentic loop verification boosts precision significantly.",
    citations: ["Agentic_RAG.pdf", "LLM_Self_Eval.md"],
    confidence: 94,
    agentSteps: [
      "Planner: Decomposed query into 2 retrieval tasks",
      "Retrieval: Queried Qdrant (Top 5 chunks)",
      "Verification: Fact-checked against source [1]",
    ],
  },
];
