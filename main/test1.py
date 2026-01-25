import os
import torch
import torchaudio
from speechbrain.pretrained import EncoderClassifier
from scipy.spatial.distance import cosine

# -----------------------------
# Load pretrained ECAPA-TDNN
# -----------------------------
classifier = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    run_opts={"device": "cpu"}   # keep CPU to avoid CUDA issues
)

# -----------------------------
# Helper: load audio
# -----------------------------
def load_audio(path):
    signal, sr = torchaudio.load(path)
    return signal

# -----------------------------
# Enrollment
# -----------------------------
def enroll_speakers(data_dir):
    speaker_embeddings = {}

    for speaker in os.listdir(data_dir):
        speaker_path = os.path.join(data_dir, speaker)

        if not os.path.isdir(speaker_path):
            continue

        embeddings = []

        for file in os.listdir(speaker_path):
            if file.lower().endswith(".wav"):
                audio = load_audio(os.path.join(speaker_path, file))
                emb = classifier.encode_batch(audio)
                embeddings.append(emb)

        if len(embeddings) == 0:
            print(f"Skipping {speaker} (no .wav files)")
            continue

        # Average embeddings
        stacked = torch.stack(embeddings)
        speaker_embeddings[speaker] = stacked.mean(dim=0)

    return speaker_embeddings

# -----------------------------
# Recognition
# -----------------------------
def recognize(audio_path, speaker_embeddings, threshold=0.65):
    audio = load_audio(audio_path)
    test_embedding = classifier.encode_batch(audio)

    scores = {}
    for speaker, ref_embedding in speaker_embeddings.items():
        u = test_embedding.detach().cpu().numpy().reshape(-1)
        v = ref_embedding.detach().cpu().numpy().reshape(-1)

        score = 1 - cosine(u, v)
        scores[speaker] = score

    best_speaker = max(scores, key=scores.get)

    if scores[best_speaker] < threshold:
        return "Unknown", scores
    else:
        return best_speaker, scores

# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":
    enrolled = enroll_speakers("data")
    speaker, scores = recognize("test.wav", enrolled)

    print("Predicted Speaker:", speaker)
    print("Similarity Scores:")
    for k, v in scores.items():
        print(f"{k}: {v:.3f}")
