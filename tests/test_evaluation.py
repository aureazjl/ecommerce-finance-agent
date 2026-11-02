import json
import unittest
from pathlib import Path
from semantic import match_dimension, match_metric

class EvaluationTests(unittest.TestCase):
    def test_has_50_questions(self):
        items = json.loads((Path(__file__).parents[1] / 'evaluation' / 'questions.json').read_text(encoding='utf-8'))
        self.assertGreaterEqual(len(items), 50)
    def test_deterministic_semantic_baseline(self):
        items = json.loads((Path(__file__).parents[1] / 'evaluation' / 'questions.json').read_text(encoding='utf-8'))
        metric_ok = sum(match_metric(x['question'])[0] == x['metric'] for x in items) / len(items)
        dimension_ok = sum((match_dimension(x['question'])[0] if x['dimension'] else None) == x['dimension'] for x in items) / len(items)
        self.assertGreaterEqual(metric_ok, .95); self.assertGreaterEqual(dimension_ok, .95)

if __name__ == '__main__': unittest.main()
