import json
import unittest
from pathlib import Path
from semantic import match_dimension, match_metric

class EvaluationTests(unittest.TestCase):
    def test_has_50_questions(self):
        root = Path(__file__).parents[1] / 'evaluation'
        items = json.loads((root / 'questions.json').read_text(encoding='utf-8')) + json.loads((root / 'questions_extended.json').read_text(encoding='utf-8'))
        self.assertGreaterEqual(len(items), 100)
    def test_deterministic_semantic_baseline(self):
        root = Path(__file__).parents[1] / 'evaluation'
        items = json.loads((root / 'questions.json').read_text(encoding='utf-8')) + json.loads((root / 'questions_extended.json').read_text(encoding='utf-8'))
        metric_ok = sum(match_metric(x['question'])[0] == x['metric'] for x in items) / len(items)
        dimension_ok = sum((match_dimension(x['question'])[0] if x['dimension'] else None) == x['dimension'] for x in items) / len(items)
        self.assertGreaterEqual(metric_ok, .95); self.assertGreaterEqual(dimension_ok, .95)

if __name__ == '__main__': unittest.main()
