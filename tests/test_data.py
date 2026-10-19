"""Contract checks for Kumilo content. No browser or network required."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def validator():
    spec = importlib.util.spec_from_file_location('validate_data', ROOT / 'scripts/validate_data.py')
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ContentContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = validator()
        cls.topic = json.loads((ROOT / 'data/klasa-4/historia/detektywi-przeszlosci/topic.json').read_text())
        cls.schema = cls.module.load_schema(ROOT / 'data/content.schema.json')

    def errors(self, topic):
        return self.module.validate_topic(topic, self.schema)

    def test_repository_data_is_valid(self):
        self.assertEqual(self.module.validate_directory(ROOT / 'data'), [])

    def test_unknown_task_type_is_rejected(self):
        topic = copy.deepcopy(self.topic)
        topic['tasks'][0]['type'] = 'anything-goes'
        self.assertTrue(self.errors(topic))

    def test_unknown_fields_are_rejected(self):
        topic = copy.deepcopy(self.topic)
        topic['tasks'][0]['typo'] = True
        self.assertTrue(self.errors(topic))

    def test_duplicate_task_ids_are_rejected(self):
        topic = copy.deepcopy(self.topic)
        topic['tasks'].append(copy.deepcopy(topic['tasks'][0]))
        self.assertTrue(self.errors(topic))

    def test_missing_lesson_reference_is_rejected(self):
        topic = copy.deepcopy(self.topic)
        topic['tasks'][0]['lessonIds'] = ['missing-lesson']
        self.assertTrue(self.errors(topic))

    def test_missing_exam_task_is_rejected(self):
        topic = copy.deepcopy(self.topic)
        topic['tests'][0]['questions'][0]['taskId'] = 'missing-task'
        self.assertTrue(self.errors(topic))

    def test_choice_answer_must_exist(self):
        topic = copy.deepcopy(self.topic)
        task = next(t for t in topic['tasks'] if t['type'] == 'single-choice')
        task['correctOptionId'] = 'missing-option'
        self.assertTrue(self.errors(topic))

    def test_order_must_be_a_complete_permutation(self):
        topic = copy.deepcopy(self.topic)
        task = next(t for t in topic['tasks'] if t['type'] == 'ordering')
        task['correctOrder'] = [task['items'][0]['id']]
        self.assertTrue(self.errors(topic))

    def test_sort_category_must_exist(self):
        topic = copy.deepcopy(self.topic)
        task = next(t for t in topic['tasks'] if t['type'] == 'sorting')
        task['items'][0]['categoryId'] = 'missing-category'
        self.assertTrue(self.errors(topic))

    def test_duplicate_pair_ids_are_rejected(self):
        topic = copy.deepcopy(self.topic)
        task = next(t for t in topic['tasks'] if t['type'] == 'matching')
        task['pairs'][1]['id'] = task['pairs'][0]['id']
        self.assertTrue(self.errors(topic))

    def test_ungraded_activity_cannot_be_an_exam_question(self):
        topic = copy.deepcopy(self.topic)
        task = next(t for t in topic['tasks'] if t['type'] == 'discovery')
        topic['tests'][0]['questions'][0]['taskId'] = task['id']
        self.assertTrue(self.errors(topic))

    def test_catalog_cannot_escape_data_directory(self):
        catalog = json.loads((ROOT / 'data/catalog.json').read_text())
        catalog['classes'][0]['subjects'][0]['topics'][0]['path'] = '../outside.json'
        with tempfile.TemporaryDirectory(prefix='hermes-content-test-') as directory:
            path = Path(directory)
            (path / 'catalog.json').write_text(json.dumps(catalog))
            (path / 'content.schema.json').write_text(json.dumps(self.schema))
            self.assertTrue(self.module.validate_directory(path))

    def test_invalid_schema_returns_errors_instead_of_crashing(self):
        with tempfile.TemporaryDirectory(prefix='hermes-content-test-') as directory:
            path = Path(directory)
            (path / 'content.schema.json').write_text('{"type": "invalid-type"}')
            (path / 'catalog.json').write_text('{}')
            self.assertTrue(self.module.validate_directory(path))

    def test_json_parser_rejects_duplicate_keys_and_nan(self):
        with tempfile.TemporaryDirectory(prefix='hermes-content-test-') as directory:
            path = Path(directory) / 'invalid.json'
            for content in ('{"id":"one","id":"two"}', '{"answer":NaN}'):
                path.write_text(content)
                with self.assertRaises(ValueError):
                    self.module.read_json(path)

    def test_empty_data_directory_is_not_valid(self):
        with tempfile.TemporaryDirectory(prefix='hermes-content-test-') as directory:
            self.assertTrue(self.module.validate_directory(Path(directory)))


if __name__ == '__main__':
    unittest.main()
