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


class RandomizedBankTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = validator()
        cls.schema = cls.module.load_schema(ROOT / 'data/content.schema.json')
        source = json.loads((ROOT / 'data/klasa-4/historia/detektywi-przeszlosci/topic.json').read_text())
        # Keep only small, explicitly defined banks, independent of content growth.
        cls.fixture = copy.deepcopy(source)
        cls.fixture.pop('learningVariants', None)
        cls.fixture['lessons'] = []
        for lesson_id in ('lesson-a', 'lesson-b', 'lesson-c'):
            lesson = copy.deepcopy(source['lessons'][0])
            lesson['id'] = lesson_id
            cls.fixture['lessons'].append(lesson)
        prototype = next(task for task in source['tasks'] if task['type'] == 'single-choice')
        cls.fixture['tasks'] = []
        for task_id, lesson_id in (('anchor-a', 'lesson-a'), ('variant-a', 'lesson-a'),
                                   ('anchor-b', 'lesson-b'), ('variant-b', 'lesson-b')):
            task = copy.deepcopy(prototype)
            task.update(id=task_id, lessonIds=[lesson_id])
            cls.fixture['tasks'].append(task)
        cls.fixture['learningPath'] = ['anchor-a', 'anchor-b']
        cls.fixture['learningVariants'] = {'anchor-a': ['variant-a'], 'anchor-b': ['variant-b']}
        test = copy.deepcopy(source['tests'][0])
        test['questions'] = [{'taskId': task['id'], 'points': 1 if 'a' == task['id'][-1] else 2}
                             for task in cls.fixture['tasks']]
        test['draw'] = [{'lessonId': 'lesson-a', 'count': 1}, {'lessonId': 'lesson-b', 'count': 1}]
        cls.fixture['tests'] = [test]

    def setUp(self):
        self.topic = copy.deepcopy(self.fixture)
        self.test = self.topic['tests'][0]

    def errors(self):
        return self.module.validate_topic(self.topic, self.schema)

    def test_valid_randomized_bank_is_not_modified(self):
        before = copy.deepcopy(self.topic)
        self.assertEqual(self.errors(), [])
        self.assertEqual(self.topic, before)

    def test_optional_fields_are_backward_compatible(self):
        del self.topic['learningVariants']
        del self.test['draw']
        self.assertEqual(self.errors(), [])

    def test_variant_bad_references(self):
        for variants in ({'missing-anchor': ['variant-a']}, {'variant-a': ['variant-b']},
                         {'anchor-a': ['missing-task']}, {'anchor-a': ['anchor-a']},
                         {'anchor-a': ['anchor-b']}):
            with self.subTest(variants=variants):
                self.topic['learningVariants'] = variants
                self.assertTrue(self.errors())

    def test_duplicate_variants(self):
        for variants in ({'anchor-a': ['variant-a', 'variant-a']},
                         {'anchor-a': ['variant-a'], 'anchor-b': ['variant-a']}):
            with self.subTest(variants=variants):
                self.topic['learningVariants'] = variants
                self.assertTrue(self.errors())

    def test_variant_lessons_must_match_as_sets(self):
        del self.test['draw']
        self.topic['tasks'][0]['lessonIds'] = ['lesson-a', 'lesson-c']
        self.topic['tasks'][1]['lessonIds'] = ['lesson-c', 'lesson-a']
        self.assertEqual(self.errors(), [])
        self.topic['tasks'][1]['lessonIds'] = ['lesson-a']
        self.assertTrue(self.errors())

    def test_variant_schema_rejects_invalid_shape(self):
        for variants in ([], {'anchor-a': []}, {'Bad ID': ['variant-a']},
                         {'anchor-a': ['Bad ID']}, {'anchor-a': 'variant-a'}):
            with self.subTest(variants=variants):
                self.topic['learningVariants'] = variants
                self.assertTrue(self.errors())

    def test_draw_unknown_lesson(self):
        self.test['draw'].append({'lessonId': 'missing-lesson', 'count': 1})
        self.assertTrue(any('nieznana lekcja' in error for error in self.errors()))

    def test_draw_unknown_task(self):
        self.test['questions'][0]['taskId'] = 'missing-task'
        self.assertTrue(any('nieznane zadanie' in error for error in self.errors()))

    def test_draw_insufficient_capacity(self):
        self.test['draw'][0]['count'] = 3
        self.assertTrue(any('za mało' in error for error in self.errors()))

    def test_draw_duplicate_lesson_even_with_different_quota(self):
        self.test['draw'].append({'lessonId': 'lesson-a', 'count': 2})
        self.assertTrue(any('powtórzony' in error for error in self.errors()))

    def test_draw_uncovered_candidates(self):
        self.test['draw'].pop()
        self.assertTrue(any('dokładnie jednej grupy' in error for error in self.errors()))

    def test_draw_overlapping_candidates(self):
        del self.topic['learningVariants']
        self.topic['tasks'][0]['lessonIds'] = ['lesson-a', 'lesson-b']
        self.assertTrue(any('dokładnie jednej grupy' in error for error in self.errors()))

    def test_draw_ignores_other_non_draw_lessons(self):
        for task in self.topic['tasks'][:2]:
            task['lessonIds'].append('lesson-c')
        self.assertEqual(self.errors(), [])

    def test_draw_requires_uniform_points_within_each_group(self):
        self.test['questions'][1]['points'] = 3
        self.assertTrue(any('points muszą' in error for error in self.errors()))

    def test_draw_schema_rejects_invalid_shape(self):
        for draw in ([], {}, [{'lessonId': 'lesson-a'}], [{'count': 1}],
                     [{'lessonId': 'Bad ID', 'count': 1}],
                     [{'lessonId': 'lesson-a', 'count': 1, 'extra': True}],
                     *[[{'lessonId': 'lesson-a', 'count': count}]
                       for count in (0, -1, 1.5, True, '1')]):
            with self.subTest(draw=draw):
                self.test['draw'] = draw
                self.assertTrue(self.errors())


if __name__ == '__main__':
    unittest.main()
