#!/usr/bin/env python3
"""
DOC SEARCH - P0-02 Comprehensive Model & Language Routing Evaluator
Benchmarks:
1. Base unprompted auto (Baseline)
2. Base prompted auto (Candidate A)
3. Base forced EN (language='en')
4. Base forced HI (language='hi')
5. Large-v3-turbo auto unprompted
6. Large-v3-turbo prompted
7. Large-v3-turbo forced HI
8. Multi-pass fallback strategy
"""

import sys
import os
import json
import time
import re

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Auto-inject known FFmpeg binary
local_app_data = os.environ.get("LOCALAPPDATA", "")
ffmpeg_bin = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe", "ffmpeg-9.0.1-full_build", "bin")
if os.path.isdir(ffmpeg_bin):
    os.environ["PATH"] = ffmpeg_bin + os.pathsep + os.environ.get("PATH", "")

import whisper

AUDIO_DIR = os.path.join(os.environ.get("TEMP", r"C:\Users\alamr\AppData\Local\Temp"), "docsearch_p0_02_corpus")
CORPUS_JSON = os.path.join(os.path.dirname(__file__), "p0-02-corpus.json")

CLINICAL_PROMPT = (
    "Clinical consultation in Hindi and Hinglish: bukhar, dard, saans, ulti, BP, SpO2, "
    "sugar, fasting, Dolo 650, Telmisartan 40 mg, Pantoprazole 40 mg, Augmentin 625 Duo, "
    "Azithromycin 500 mg, Glycomet 500 mg, Montair-LC, Pan 40, Calpol 650."
)

def levenshtein_tokens(a, b):
    an, bn = len(a), len(b)
    if an == 0: return bn
    if bn == 0: return an
    matrix = [[0] * (bn + 1) for _ in range(an + 1)]
    for i in range(an + 1): matrix[i][0] = i
    for j in range(bn + 1): matrix[0][j] = j
    for i in range(1, an + 1):
        for j in range(1, bn + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            matrix[i][j] = min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    return matrix[an][bn]

def normalize_tokens(text):
    clean = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    return [t for t in clean.split() if t]

def compute_wer(ref, hyp):
    r = normalize_tokens(ref)
    h = normalize_tokens(hyp)
    if not r: return 0.0 if not h else 1.0
    return levenshtein_tokens(r, h) / len(r)

def compute_cer(ref, hyp):
    r = re.sub(r"\s+", "", ref.lower())
    h = re.sub(r"\s+", "", hyp.lower())
    if not r: return 0.0 if not h else 1.0
    return levenshtein_tokens(list(r), list(h)) / len(r)

def evaluate_transcript(item, hyp_text):
    wer = compute_wer(item["groundTruth"], hyp_text)
    cer = compute_cer(item["groundTruth"], hyp_text)
    
    # Medicine preservation
    med_pres = 0
    for med in item.get("expectedMedicines", []):
        if med.lower() in hyp_text.lower():
            med_pres += 1
    med_acc = 1.0 if not item.get("expectedMedicines") else (med_pres / len(item["expectedMedicines"]))

    # Numeric preservation
    num_pres = 0
    hyp_toks = normalize_tokens(hyp_text)
    for num in item.get("expectedNumerics", []):
        if num.lower() in hyp_toks or num in hyp_text:
            num_pres += 1
    num_acc = 1.0 if not item.get("expectedNumerics") else (num_pres / len(item["expectedNumerics"]))

    # Critical terms
    term_pres = 0
    for term in item.get("criticalTerms", []):
        words = term.lower().split()
        if all(w in hyp_text.lower() for w in words):
            term_pres += 1
    term_acc = 1.0 if not item.get("criticalTerms") else (term_pres / len(item["criticalTerms"]))

    return wer, cer, med_acc, num_acc, term_acc


def run_configuration(config_name, model, items, language=None, initial_prompt=None):
    print(f"\n=================================================================")
    print(f"RUNNING CONFIGURATION: {config_name}")
    print(f"Parameters: language={language}, prompt={'YES' if initial_prompt else 'NO'}")
    print(f"=================================================================")

    results = []
    latencies = []

    for idx, item in enumerate(items):
        audio_path = os.path.join(AUDIO_DIR, f"{item['id']}.wav")
        if not os.path.isfile(audio_path):
            print(f"Warning: Missing audio for {item['id']}")
            continue

        kwargs = {"temperature": 0.0}
        if language:
            kwargs["language"] = language
        if initial_prompt:
            kwargs["initial_prompt"] = initial_prompt

        t0 = time.time()
        res = model.transcribe(audio_path, **kwargs)
        dur_ms = int((time.time() - t0) * 1000)
        latencies.append(dur_ms)

        hyp_text = res.get("text", "").strip()
        det_lang = res.get("language", "unknown")
        
        # Calculate acoustic logprob confidence
        segments = res.get("segments", [])
        logprobs = [s.get("avg_logprob", -1.0) for s in segments if "avg_logprob" in s]
        avg_logprob = sum(logprobs) / len(logprobs) if logprobs else -1.0

        wer, cer, med_acc, num_acc, term_acc = evaluate_transcript(item, hyp_text)

        results.append({
            "id": item["id"],
            "language": item["language"],
            "category": item["category"],
            "groundTruth": item["groundTruth"],
            "hypothesis": hyp_text,
            "detectedLanguage": det_lang,
            "latencyMs": dur_ms,
            "avgLogprob": round(avg_logprob, 3),
            "wer": round(wer, 3),
            "cer": round(cer, 3),
            "medAcc": round(med_acc, 3),
            "numAcc": round(num_acc, 3),
            "termAcc": round(term_acc, 3)
        })

        if idx % 5 == 0 or idx == len(items) - 1:
            print(f"  [{idx+1}/{len(items)}] {item['id']}: WER={wer*100:.1f}%, CER={cer*100:.1f}%, Latency={dur_ms}ms, Lang={det_lang}")

    # Aggregate summaries
    def filter_lang(l): return [r for r in results if r["language"] == l]
    def avg(lst, k): return (sum(x[k] for x in lst) / len(lst)) if lst else 0.0

    hi = filter_lang("HINDI")
    hng = filter_lang("HINGLISH")
    en = filter_lang("ENGLISH")

    sorted_lat = sorted(latencies)
    p95_lat = sorted_lat[int(len(sorted_lat) * 0.95)] if sorted_lat else 0

    summary = {
        "configName": config_name,
        "sampleCount": len(results),
        "hindiWER": avg(hi, "wer"),
        "hindiCER": avg(hi, "cer"),
        "hinglishWER": avg(hng, "wer"),
        "hinglishCER": avg(hng, "cer"),
        "englishWER": avg(en, "wer"),
        "englishCER": avg(en, "cer"),
        "medicineAccuracy": avg(results, "medAcc"),
        "numericAccuracy": avg(results, "numAcc"),
        "clinicalTermAccuracy": avg(results, "termAcc"),
        "avgLatencyMs": int(sum(latencies) / len(latencies)) if latencies else 0,
        "p95LatencyMs": p95_lat,
        "results": results
    }

    print(f"\n--- SUMMARY [{config_name}] ---")
    print(f"Hindi WER:              {summary['hindiWER']*100:.2f}%")
    print(f"Hinglish WER:           {summary['hinglishWER']*100:.2f}%")
    print(f"English WER:            {summary['englishWER']*100:.2f}%")
    print(f"Medicine Accuracy:      {summary['medicineAccuracy']*100:.2f}%")
    print(f"Numeric Accuracy:       {summary['numericAccuracy']*100:.2f}%")
    print(f"Clinical Term Accuracy: {summary['clinicalTermAccuracy']*100:.2f}%")
    print(f"Avg Latency:            {summary['avgLatencyMs']} ms")
    print(f"P95 Latency:            {summary['p95LatencyMs']} ms")

    return summary


def main():
    target_config = sys.argv[1] if len(sys.argv) > 1 else "ROUTING_SUITE"
    print(f"Running P0-02 evaluation suite for: {target_config}")

    with open(CORPUS_JSON, "r", encoding="utf-8") as f:
        items = json.load(f)

    all_summaries = {}

    if target_config in ("ROUTING_SUITE", "BASE_FORCED_EN", "BASE_FORCED_HI"):
        print("\nLoading Whisper base model into memory...")
        t0 = time.time()
        base_model = whisper.load_model("base", device="cpu")
        print(f"Base model loaded in {time.time()-t0:.2f}s")

        if target_config in ("ROUTING_SUITE", "BASE_FORCED_EN"):
            all_summaries["FORCED_EN_BASE"] = run_configuration(
                "FORCED_EN_BASE", base_model, items, language="en", initial_prompt=None
            )

        if target_config in ("ROUTING_SUITE", "BASE_FORCED_HI"):
            all_summaries["FORCED_HI_BASE"] = run_configuration(
                "FORCED_HI_BASE", base_model, items, language="hi", initial_prompt=None
            )

    if target_config in ("ROUTING_SUITE", "TURBO_SUITE", "TURBO_PROMPTED", "TURBO_AUTO"):
        print("\nLoading Whisper large-v3-turbo model into memory...")
        t0 = time.time()
        turbo_model = whisper.load_model("large-v3-turbo", device="cpu")
        print(f"Large-v3-turbo model loaded in {time.time()-t0:.2f}s")

        if target_config in ("ROUTING_SUITE", "TURBO_SUITE", "TURBO_PROMPTED"):
            all_summaries["LARGE_V3_TURBO_PROMPTED"] = run_configuration(
                "LARGE_V3_TURBO_PROMPTED", turbo_model, items, language=None, initial_prompt=CLINICAL_PROMPT
            )

    # Save summary results
    out_file = os.path.join(os.environ.get("TEMP", r"C:\Users\alamr\AppData\Local\Temp"), f"p0_02_{target_config.lower()}_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_summaries, f, ensure_ascii=False, indent=2)
    print(f"\nAll evaluations saved to: {out_file}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
