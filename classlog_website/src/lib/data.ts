export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface ClassSession {
  id: string;
  courseId: string;
  date: string;
  duration: string;
  summary: string;
  fullSummary: string;
  keyPoints: string[];
  questions: { question: string; answer: string }[];
  transcript: TranscriptEntry[];
}

export interface Course {
  id: string;
  name: string;
  semester: string;
  instructor: string;
  description: string;
}

export const COURSES: Course[] = [
  {
    id: "cs101",
    name: "Fundamentals of Web Development",
    semester: "Fall 2025",
    instructor: "Dr. Alan Turing",
    description: "An intensive introduction to the core technologies of the World Wide Web. Covering everything from HTTP protocols to advanced DOM manipulation.",
  },
  {
    id: "ds202",
    name: "Deep Dive Into Modern Frontend Frameworks",
    semester: "Spring 2025",
    instructor: "Prof. Grace Hopper",
    description: "Exploring the internal mechanics of React, Vue, and Svelte. Understanding reactivity, virtual DOM, and component-based architectures.",
  },
  {
    id: "ai303",
    name: "Distributed Systems and Backend Architecture",
    semester: "Fall 2024",
    instructor: "Dr. Marvin Minsky",
    description: "Building scalable, fault-tolerant systems. Focus on microservices, event-driven architecture, and database consistency models.",
  },
  {
    id: "re404",
    name: "Advanced Security in Web Applications",
    semester: "Spring 2024",
    instructor: "Dr. Barbara Liskov",
    description: "A rigorous study of web vulnerabilities and defensive programming. Covering OAuth2, JWT, CSRF protection, and cryptographic implementations.",
  },
  {
    id: "ux505",
    name: "Human-Computer Interaction & UX Research",
    semester: "Fall 2025",
    instructor: "Dr. Don Norman",
    description: "The psychology of user interface design. Analyzing cognitive load, accessibility standards, and iterative usability testing.",
  },
  {
    id: "db606",
    name: "Query Optimization and Database Internals",
    semester: "Spring 2025",
    instructor: "Dr. Edgar Codd",
    description: "Deep dive into relational algebra, indexing strategies, and the physical storage layer of modern DBMS.",
  },
];

export const SESSIONS: ClassSession[] = [
  {
    id: "s1",
    courseId: "cs101",
    date: "September 12, 2025",
    duration: "45 mins",
    summary: "Basics of binary representation and logic gates in the context of web encoding.",
    fullSummary: "This session provides a deep technical dive into binary representation and the physical layer of web communication. We covered the transition from analog signals to discrete binary states, the role of logic gates in routing and processing, and how these fundamental concepts enable the complex encoding schemes used in modern web browsers. Key topics included the mathematical proof for binary efficiency in digital systems, the construction of half-adders from NAND gates, and the critical importance of UTF-8 in maintaining global interoperability for web content.",
    keyPoints: [
      "Binary Foundations: Deep understanding of how voltage states are abstracted into logical bits.",
      "Logic Gate Architecture: How AND, OR, and NOT gates form the basis for all software branching and loops.",
      "Circuit Logic: Step-by-step construction of arithmetic circuits from basic logic primitives.",
      "Encoding Standards: Detailed analysis of UTF-8, its variable-width nature, and why it surpassed ASCII for global web dominance.",
      "Hardware-Software Interface: How high-level web code eventually translates to gate-level operations.",
    ],
    questions: [
      {
        question: "Why do computers use binary instead of decimal for web protocols?",
        answer: "Computers use binary because it provides the highest noise immunity in electronic circuits. For web protocols, binary data transfer (like HTTP/2) allows for much more efficient machine parsing with significantly lower CPU overhead compared to text-based decimal systems.",
      },
      {
        question: "How does UTF-8 ensure backward compatibility with ASCII?",
        answer: "UTF-8 was ingeniously designed so that any valid ASCII string is also a valid UTF-8 string. It uses the highest bit of a byte to signal if it's a single-byte character (ASCII) or the start of a multi-byte sequence, allowing old software to still process basic text while new software handles the full Unicode range.",
      },
    ],
    transcript: [
      { speaker: "Dr. Alan Turing", timestamp: "00:00", text: "Welcome everyone to CS101. Today we start with the absolute foundation: binary representation and how it affects web data." },
      { speaker: "Student A", timestamp: "05:12", text: "Professor, is binary the only way to represent data in a digital system, or are there experimental multi-state systems that could improve web performance?" },
      { speaker: "Dr. Alan Turing", timestamp: "05:30", text: "That is a sophisticated question. While ternary computers have been explored, the efficiency of binary in current CMOS technology makes it the undisputed standard. In web terms, binary framing in HTTP/2 is what gives us the performance boosts we see today." },
      { speaker: "Dr. Alan Turing", timestamp: "10:45", text: "Now, let's look at the AND gate logic table. Notice how the output is only high when both inputs are high. This is exactly how your 'if' statements work at the hardware level." },
      { speaker: "Dr. Alan Turing", timestamp: "15:20", text: "Moving on to encoding, UTF-8 is the backbone of the web. Without a standard way to interpret these 1s and 0s, a browser in Tokyo wouldn't be able to read a page served from New York." },
    ],
  },
  {
    id: "s2",
    courseId: "cs101",
    date: "September 15, 2025",
    duration: "50 mins",
    summary: "Introduction to high-level programming languages and the evolution of the web stack.",
    fullSummary: "In this lecture, we discussed the evolution of programming from low-level machine code to modern high-level abstractions like JavaScript and TypeScript. The primary focus was on the trade-offs between compiled languages and interpreted languages in the browser environment. We analyzed the 'Compiliation Cycle' versus the 'Runtime Interpretation' model, specifically focusing on the V8 engine's JIT (Just-In-Time) compilation. We discussed how abstraction layers allow web developers to solve complex UI problems without managing memory addresses directly, while also acknowledging the performance overhead introduced by these layers.",
    keyPoints: [
      "Historical context: From assembly to FORTRAN, and the rise of JavaScript in 1995.",
      "Abstraction layers: How the DOM and CSSOM hide complex rendering mechanics.",
      "Compiler vs Interpreter: Understanding JIT compilation in modern browser engines.",
      "Memory Management: Garbage collection in JS and its impact on frame rates and UI responsiveness.",
    ],
    questions: [
      {
        question: "Is JavaScript always slower than C++ because it's interpreted?",
        answer: "While JS is inherently slower for raw CPU-bound tasks, modern JIT engines like V8 make it remarkably close for many use cases. Additionally, WebAssembly now allows near-native performance for critical paths, effectively bridging the gap for performance-intensive web apps.",
      },
    ],
    transcript: [
      { speaker: "Dr. Alan Turing", timestamp: "00:00", text: "Today we transition from raw bits to high-level abstractions. Why do we write in JavaScript instead of machine code?" },
      { speaker: "Student B", timestamp: "08:15", text: "Is it primarily about developer productivity, or are there safety benefits as well?" },
      { speaker: "Dr. Alan Turing", timestamp: "08:45", text: "Both. Abstraction allows us to reason about 'Buttons' and 'Events' instead of memory offsets. It also prevents whole classes of memory errors that plagued early computing." },
    ],
  },
  {
    id: "s3",
    courseId: "ds202",
    date: "October 05, 2025",
    duration: "60 mins",
    summary: "Deep dive into React's Reconciliation algorithm and the Fiber architecture.",
    fullSummary: "In this advanced session, we explored the inner workings of React's reconciliation process, specifically the shift from the stack reconciler to the Fiber architecture. We discussed how Fiber enables incremental rendering by breaking down work into small units and prioritizing them based on urgency. The lecture detailed the 'double buffering' technique used during the commit phase to ensure UI consistency, and how the 'Effect List' (now part of the tag system in newer versions) tracks side effects to be applied to the DOM. We also touched upon the heuristic O(n) algorithm used for tree diffing and why keys are critical for performance in list rendering.",
    keyPoints: [
      "Reconciliation vs Rendering: Distinguishing between the algorithm that calculates differences and the library that updates the UI.",
      "Fiber Architecture: Understanding work units (fibers), concurrency, and how React yields back to the main thread.",
      "Priority Levels: How React categorizes updates (Discrete, Continuous, Default, Idle) to maintain 60fps responsiveness.",
      "Double Buffering: The concept of current and work-in-progress trees for atomic DOM updates.",
      "Diffing Heuristics: Why React assumes two elements of different types will produce different trees, and the O(n) complexity trade-off.",
    ],
    questions: [
      {
        question: "How does React Fiber prevent 'blocking' the main thread during heavy updates?",
        answer: "Fiber uses a requestIdleCallback-like mechanism to perform small units of work. If a higher-priority task (like a user click) comes in, React can pause the rendering of the current tree, handle the event, and then either resume or restart the rendering process based on the new state.",
      },
      {
        question: "Why is it discouraged to use array indices as keys in React?",
        answer: "Using indices as keys can lead to significant performance issues and UI bugs when items are reordered, added, or removed. React uses the key to match elements between the old and new tree; if the key is just an index, React might incorrectly reuse component state for the wrong data item.",
      },
    ],
    transcript: [
      { speaker: "Prof. Grace Hopper", timestamp: "00:00", text: "Today we're looking under the hood of React. Forget JSX for a moment; let's talk about the Fiber architecture." },
      { speaker: "Student C", timestamp: "12:30", text: "Does Fiber actually make the initial render faster, or is it mostly about keeping the UI responsive during updates?" },
      { speaker: "Prof. Grace Hopper", timestamp: "13:00", text: "Excellent point. Fiber doesn't necessarily make the raw calculation faster—it makes it 'smarter'. By being able to interrupt work, it ensures that animations and inputs stay fluid even if a large list is being processed in the background." },
    ],
  },
];
