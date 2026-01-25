# Example JSON Outputs

## Sample Transcript

```
Welcome to today's class on machine learning. Today we will cover the basics of neural networks, including forward propagation and backpropagation. Neural networks are computational models inspired by biological neural networks. They consist of layers of interconnected nodes called neurons. The first layer is the input layer, which receives the data. The hidden layers process the information, and the output layer produces the final prediction. Backpropagation is the algorithm used to train neural networks by adjusting weights based on error. We'll also discuss activation functions like ReLU and sigmoid. Any questions so far?
```

## Perplexity Summary Response

```json
{
  "short": "This class introduces neural networks, covering their structure with input, hidden, and output layers. The lecture explains forward propagation for making predictions and backpropagation for training. Activation functions like ReLU and sigmoid are also discussed as key components of neural network architecture.",
  "detailed": "The class session provides an introduction to machine learning fundamentals, specifically focusing on neural networks. The instructor explains that neural networks are computational models inspired by biological neural networks, consisting of interconnected nodes called neurons organized into layers. The architecture includes an input layer that receives data, hidden layers that process information, and an output layer that produces predictions. The lecture covers two key algorithms: forward propagation, which is used to make predictions through the network, and backpropagation, which is the training algorithm that adjusts network weights based on error. Additionally, the instructor mentions activation functions such as ReLU and sigmoid as important components of neural network design. The session concludes with an invitation for student questions.",
  "bulletPoints": [
    "Neural networks are computational models inspired by biological neural networks",
    "Neural networks consist of layers: input, hidden, and output layers",
    "Forward propagation is used to make predictions through the network",
    "Backpropagation is the training algorithm that adjusts weights based on error",
    "Activation functions like ReLU and sigmoid are key components"
  ],
  "keyDecisions": [
    "Focus on neural network basics in this session",
    "Cover both forward propagation and backpropagation algorithms"
  ],
  "actionItems": [
    "Students should review neural network architecture concepts",
    "Prepare questions about activation functions for next class"
  ],
  "topics": [
    {
      "name": "Neural Network Introduction",
      "description": "Overview of neural networks as computational models inspired by biological systems",
      "timestamps": [
        {
          "startMs": 0,
          "endMs": 15000
        }
      ]
    },
    {
      "name": "Network Architecture",
      "description": "Structure of neural networks with input, hidden, and output layers",
      "timestamps": [
        {
          "startMs": 15000,
          "endMs": 30000
        }
      ]
    },
    {
      "name": "Forward Propagation",
      "description": "Algorithm for making predictions through the network",
      "timestamps": [
        {
          "startMs": 30000,
          "endMs": 40000
        }
      ]
    },
    {
      "name": "Backpropagation",
      "description": "Training algorithm that adjusts weights based on error",
      "timestamps": [
        {
          "startMs": 40000,
          "endMs": 50000
        }
      ]
    },
    {
      "name": "Activation Functions",
      "description": "Functions like ReLU and sigmoid used in neural networks",
      "timestamps": [
        {
          "startMs": 50000,
          "endMs": 60000
        }
      ]
    }
  ],
  "evidence": [
    {
      "quote": "Neural networks are computational models",
      "context": "Defines what neural networks are"
    },
    {
      "quote": "forward propagation and backpropagation",
      "context": "Lists the two main algorithms covered"
    },
    {
      "quote": "input layer, which receives the data",
      "context": "Describes the function of the input layer"
    },
    {
      "quote": "Backpropagation is the algorithm used to train",
      "context": "Explains the purpose of backpropagation"
    },
    {
      "quote": "activation functions like ReLU and sigmoid",
      "context": "Mentions specific activation functions discussed"
    }
  ]
}
```

## Firestore Session Document (After Processing)

```json
{
  "classId": "class_abc123",
  "title": "Introduction to Neural Networks",
  "joinCode": "ABC123",
  "status": "ready",
  "startedAt": null,
  "endedAt": null,
  "createdBy": "admin",
  "audioProcessing": {
    "source": "https://storage.googleapis.com/project.appspot.com/sessions/session_xyz/raw_audio.wav",
    "sampleRate": 16000,
    "durationSec": 65.5,
    "deletedAudio": false
  },
  "transcript": {
    "fullText": "Welcome to today's class on machine learning. Today we will cover the basics of neural networks, including forward propagation and backpropagation...",
    "language": "en",
    "createdAt": "2026-01-24T10:30:00Z"
  },
  "summary": {
    "short": "This class introduces neural networks...",
    "detailed": "The class session provides an introduction...",
    "bulletPoints": [
      "Neural networks are computational models...",
      "Neural networks consist of layers..."
    ],
    "keyDecisions": [
      "Focus on neural network basics..."
    ],
    "actionItems": [
      "Students should review neural network architecture..."
    ],
    "evidence": [
      {
        "quote": "Neural networks are computational models",
        "context": "Defines what neural networks are"
      }
    ]
  },
  "topics": [
    {
      "name": "Neural Network Introduction",
      "description": "Overview of neural networks...",
      "timestamps": [
        {
          "startMs": 0,
          "endMs": 15000
        }
      ]
    }
  ],
  "speakers": [],
  "segments": [
    {
      "startMs": 0,
      "endMs": 5234,
      "speakerId": null,
      "text": "Welcome to today's class on machine learning."
    },
    {
      "startMs": 5234,
      "endMs": 10234,
      "speakerId": null,
      "text": "Today we will cover the basics of neural networks, including forward propagation and backpropagation."
    }
  ],
  "createdAt": "2026-01-24T10:00:00Z",
  "updatedAt": "2026-01-24T10:35:00Z"
}
```

## Notes

- All quotes in `evidence` are exact snippets from the transcript (max 15 words)
- Topics include approximate timestamps derived from segment indices
- Summary does not hallucinate - all content is from the transcript
- Action items and decisions are only included if explicitly stated or clearly implied
