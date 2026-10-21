"""Independent learningPlan schema and semantic regression fixtures."""
import copy
import unittest
from typing import Any
from test_data import validator, ROOT


def fixture() -> dict[str, Any]:
    tasks = []
    for name, kind in [('a', 'single-choice'), ('b', 'number-answer'), ('c', 'single-choice')]:
        task: dict[str, Any] = dict(id=name, type=kind, title='Zadanie', instruction='Wybierz', explanation='Tak', lessonIds=['lesson'])
        if kind == 'number-answer':
            task.update(answer=1, tolerance=0, unit='szt.')
        else:
            task.update(options=[dict(id='yes', text='Tak'), dict(id='no', text='Nie')], correctOptionId='yes')
        tasks.append(task)
    return dict(schemaVersion='1.0', kind='topic', id='topic', grade=4, subjectId='historia', language='pl-PL', title='Temat', summary='Opis',
                lessons=[dict(id='lesson', title='Lekcja', goals=['Cel'], paragraphs=['Opis'])], tasks=tasks, learningPath=['a', 'b', 'c'],
                mindMap=dict(id='root', title='Mapa', text='Opis', children=[]),
                tests=[dict(id='test', title='Test', questions=[dict(taskId='a', points=1)], feedback='after-submit', scoring='all-or-nothing', shuffleQuestions=False, timeLimitSeconds=None)],
                learningPlan=dict(defaults=dict(extraPractice=1, reviewCount=2, avoidImmediateRepeat=True), requiredTypes=['single-choice', 'number-answer'],
                                  steps=[dict(id='step', title='Krok', types=['single-choice', 'number-answer'], count=2, hints=True)],
                                  lessons=[dict(lessonId='lesson', steps=[dict(id='step', taskIds=['a', 'b', 'c'])])]))


class LearningPlanTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = validator()
        cls.schema = cls.module.load_schema(ROOT / 'data/content.schema.json')

    def errors(self, t):
        return self.module.validate_topic(t, self.schema)

    def test_valid_plan_and_legacy(self):
        t = fixture()
        self.assertEqual(self.errors(t), [])
        del t['learningPlan']
        self.assertEqual(self.errors(t), [])

    def test_contract_failures(self):
        changes = [
            lambda p: p.update(unknown=True),
            lambda p: p['defaults'].update(extraPractice=True),
            lambda p: p['steps'][0].update(taskIds=['a']),
            lambda p: p['lessons'][0]['steps'][0].update(id='missing'),
            lambda p: p['lessons'][0]['steps'][0].update(taskIds=['a', 'a']),
            lambda p: p.update(lessons=[]),
            lambda p: p['lessons'][0]['steps'][0].update(count=1),
            lambda p: p['requiredTypes'].append('discovery'),
        ]
        for change in changes:
            with self.subTest(change=change):
                t = fixture()
                change(t['learningPlan'])
                self.assertTrue(self.errors(t))

    def test_cross_step_pool_overlap_and_wrong_lesson(self):
        t = fixture()
        t['learningPlan']['lessons'][0]['steps'].append(dict(id='other', taskIds=['a']))
        t['learningPlan']['steps'].append(dict(id='other', title='Inny', types=['single-choice'], count=1, hints=False))
        self.assertTrue(self.errors(t))
        t = fixture()
        t['tasks'][0]['lessonIds'] = ['missing']
        self.assertTrue(self.errors(t))

    def test_no_mutation_and_matching_not_bank_presence(self):
        t = fixture()
        before = copy.deepcopy(t)
        self.errors(t)
        self.assertEqual(t, before)
        t['learningPlan']['lessons'][0]['steps'][0]['count'] = 1
        self.assertTrue(self.errors(t))
