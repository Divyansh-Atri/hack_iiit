import os
import torch
import torchaudio
from speechbrain.pretrained import EncoderClassifier
from scipy.spatial.distance import cosine

classifier = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    run_opts={"device": "cpu"}   # keep CPU to avoid CUDA issues
)

def load_audio(path):
    signal, sr = torchaudio.load(path)
    return signal


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


        







if __name__ == "__main__":    
    speaker_embeddings = torch.load(
        "speaker_embedding.pt",
        map_location="cpu"
    )
    speaker, scores = recognize("test.wav", speaker_embeddings)
    print("Predicted Speaker:", speaker)
    print("Similarity Scores:")
    for k, v in scores.items():
        print(f"{k}: {v:.3f}")