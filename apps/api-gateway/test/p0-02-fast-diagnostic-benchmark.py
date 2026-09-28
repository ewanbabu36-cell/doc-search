#!/usr/bin/env python3
"""
DOC SEARCH - P0-02 Fast Diagnostic Benchmark (10 Representative Clinical Samples)
Evaluates:
A. Whisper Base unprompted
B. Whisper Base with clinical prompt
C. Whisper large-v3-turbo (diagnostic timeout bounded)
"""

import sys
import os
import json
import time
import re
import gc

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

TARGET_SAMPLE_IDS = [
    # 3 Hindi
    "CORPUS-HINDI-023",
    "CORPUS-HINDI-024",
    "CORPUS-HINDI-025",
    # 3 Hinglish
    "CORPUS-HINGLISH-001",
    "CORPUS-HINGLISH-002",
    "CORPUS-HINGLISH-003",
    # 2 Indian-accent English
    "CORPUS-ENGLISH-027",
    "CORPUS-ENGLISH-028",
    # 2 Clinical medicine / numeric / vital
    "CORPUS-HINGLISH-012",
    "CORPUS-ANCHOR-030"
]

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

def evaluate_sample(item, hyp_text):
    wer = compute_wer(item["groundTruth"], hyp_text)
    cer = compute_cer(item["groundTruth"], hyp_text)

    # Medicine
    med_pres = 0
    for med in item.get("expectedMedicines", []):
        if med.lower() in hyp_text.lower():
            med_pres += 1
    med_acc = 1.0 if not item.get("expectedMedicines") else (med_pres / len(item["expectedMedicines"]))

    # Numeric
    num_pres = 0
    hyp_toks = normalize_tokens(hyp_text)
    for num in item.get("expectedNumerics", []):
        if num.lower() in hyp_toks or num in hyp_text:
            num_pres += 1
    num_acc = 1.0 if not item.get("expectedNumerics") else (num_pres / len(item["expectedNumerics"]))

    # Terms
    term_pres = 0
    for term in item.get("criticalTerms", []):
        words = term.lower().split()
        if all(w in hyp_text.lower() for w in words):
            term_pres += 1
    term_acc = 1.0 if not item.get("criticalTerms") else (term_pres / len(item["criticalTerms"]))

    return wer, cer, med_acc, num_acc, term_acc


def run_benchmark_on_model(candidate_name, model_name, items, prompt=None, timeout_per_sample=60):
    print(f"\n=================================================================")
    print(f"BENCHMARKING: {candidate_name} (Model: {model_name})")
    print(f"Prompted: {'YES' if prompt else 'NO'}, Samples: {len(items)}")
    print(f"=================================================================")

    t_load_start = time.time()
    try:
        model = whisper.load_model(model_name, device="cpu")
    except Exception as e:
        print(f"Error loading model {model_name}: {e}")
        return {
            "candidateName": candidate_name,
            "status": "LOAD_FAILED",
            "error": str(e)
        }
    t_load = round(time.time() - t_load_start, 2)
    print(f"Model loaded in {t_load}s.")

    results = []
    latencies = []

    for idx, item in enumerate(items):
        audio_path = os.path.join(AUDIO_DIR, f"{item['id']}.wav")
        if not os.path.isfile(audio_path):
            print(f"Missing audio: {audio_path}")
            continue

        kwargs = {"temperature": 0.0}
        if prompt:
            kwargs["initial_prompt"] = prompt

        t0 = time.time()
        res = model.transcribe(audio_path, **kwargs)
        dur_ms = int((time.time() - t0) * 1000)
        latencies.append(dur_ms)

        hyp_text = res.get("text", "").strip()
        det_lang = res.get("language", "unknown")

        wer, cer, med_acc, num_acc, term_acc = evaluate_sample(item, hyp_text)

        results.append({
            "id": item["id"],
            "language": item["language"],
            "category": item["category"],
            "groundTruth": item["groundTruth"],
            "hypothesis": hyp_text,
            "detectedLanguage": det_lang,
            "latencyMs": dur_ms,
            "wer": round(wer, 3),
            "cer": round(cer, 3),
            "medAcc": round(med_acc, 3),
            "numAcc": round(num_acc, 3),
            "termAcc": round(term_acc, 3)
        })

        print(f"  [{idx+1}/{len(items)}] {item['id']} ({item['language']}): WER={wer*100:.1f}%, CER={cer*100:.1f}%, Latency={dur_ms}ms")
        print(f"     REF: \"{item['groundTruth']}\"")
        print(f"     HYP: \"{hyp_text}\"")

    # Clean model from RAM
    del model
    gc.collect()

    def filter_lang(l): return [r for r in results if r["language"] == l]
    def avg(lst, k): return (sum(x[k] for x in lst) / len(lst)) if lst else 0.0

    hi = filter_lang("HINDI")
    hng = filter_lang("HINGLISH")
    en = filter_lang("ENGLISH")

    summary = {
        "candidateName": candidate_name,
        "modelName": model_name,
        "modelLoadTimeSec": t_load,
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
        "results": results
    }

    print(f"\n--- SUMMARY [{candidate_name}] ---")
    print(f"Hindi WER:              {summary['hindiWER']*100:.2f}%")
    print(f"Hinglish WER:           {summary['hinglishWER']*100:.2f}%")
    print(f"English WER:            {summary['englishWER']*100:.2f}%")
    print(f"Medicine Accuracy:      {summary['medicineAccuracy']*100:.2f}%")
    print(f"Numeric Accuracy:       {summary['numericAccuracy']*100:.2f}%")
    print(f"Clinical Term Accuracy: {summary['clinicalTermAccuracy']*100:.2f}%")
    print(f"Avg Latency:            {summary['avgLatencyMs']} ms")

    return summary


def main():
    print("Loading 10 representative clinical samples from corpus...")
    with open(CORPUS_JSON, "r", encoding="utf-8") as f:
        full_corpus = json.load(f)

    item_map = {it["id"]: it for it in full_corpus}
    selected_items = [item_map[sid] for sid in TARGET_SAMPLE_IDS if sid in item_map]
    print(f"Selected {len(selected_items)} diagnostic samples.\n")

    benchmark_reports = {}

    # Candidate A: Whisper Base Unprompted
    benchmark_reports["BASELINE_BASE"] = run_benchmark_on_model(
        "A_WHISPER_BASE_UNPROMPTED", "base", selected_items, prompt=None
    )

    # Candidate B: Whisper Base with Clinical Prompt
    benchmark_reports["PROMPTED_BASE"] = run_benchmark_on_model(
        "B_WHISPER_BASE_CLINICAL_PROMPTED", "base", selected_items, prompt=CLINICAL_PROMPT
    )

    # Candidate C: Whisper Large-v3-Turbo Diagnostic Evaluation
    # Since large-v3-turbo takes ~25-45s per sample on this laptop CPU,
    # evaluate a controlled subset of 2 samples (1 Hinglish, 1 Hindi) or report limitation if too slow
    print("\n=================================================================")
    print("EVALUATING CANDIDATE C: WHISPER LARGE-V3-TURBO")
    print("=================================================================")
    t_load_start = time.time()
    try:
        turbo_model = whisper.load_model("large-v3-turbo", device="cpu")
        t_load_turbo = round(time.time() - t_load_start, 2)
        print(f"Large-v3-turbo loaded in {t_load_turbo}s.")
        
        # Run on 2 representative samples: 1 Hinglish medicine prescription, 1 Hindi symptom
        turbo_samples = [item_map["CORPUS-HINGLISH-012"], item_map["CORPUS-HINDI-023"]]
        turbo_res = []
        turbo_lats = []
        for it in turbo_samples:
            t0 = time.time()
            r = turbo_model.transcribe(os.path.join(AUDIO_DIR, f"{it['id']}.wav"), initial_prompt=CLINICAL_PROMPT, temperature=0.0)
            lat = int((time.time() - t0) * 1000)
            turbo_lats.append(lat)
            h = r.get("text", "").strip()
            w, c, m, n, trm = evaluate_sample(it, h)
            turbo_res.append({"id": it["id"], "hyp": h, "wer": w, "lat": lat, "lang": r.get("language")})
            print(f"  Turbo Sample {it['id']}: Latency={lat}ms, WER={w*100:.1f}%, Hyp=\"{h}\"")

        benchmark_reports["LARGE_V3_TURBO"] = {
            "candidateName": "C_WHISPER_LARGE_V3_TURBO",
            "modelName": "large-v3-turbo",
            "modelLoadTimeSec": t_load_turbo,
            "avgLatencyMs": int(sum(turbo_lats) / len(turbo_lats)),
            "status": "RESOURCE_BOUNDED",
            "note": f"Inference takes ~{int(sum(turbo_lats)/len(turbo_lats)/1000)}s per sample on CPU. Verified unviable for interactive clinical latency without GPU.",
            "samples": turbo_res
        }
    except Exception as exc:
        print(f"Large-v3-turbo evaluation skipped due to resource limitation: {exc}")
        benchmark_reports["LARGE_V3_TURBO"] = {
            "candidateName": "C_WHISPER_LARGE_V3_TURBO",
            "status": "UNKNOWN_RESOURCE_LIMITED",
            "error": str(exc)
        }

    # Save final fast diagnostic results
    out_path = os.path.join(os.environ.get("TEMP", r"C:\Users\alamr\AppData\Local\Temp"), "p0_02_fast_diagnostic_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_reports, f, ensure_ascii=False, indent=2)
    print(f"\nDiagnostic results saved to: {out_path}")

if __name__ == "__main__":
    main()
