#!/usr/bin/env python3
"""Validate Kumilo JSON structure, answers and cross-file references."""
import argparse
from collections import Counter
import json
from pathlib import Path
import sys

try:
    from jsonschema import Draft202012Validator
    from jsonschema.exceptions import SchemaError
except ImportError:
    raise SystemExit('Brak jsonschema. Zainstaluj zależności: python3 -m pip install -r requirements-dev.txt')


def read_json(path):
    def unique_keys(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f'Powtórzony klucz JSON: {key}')
            result[key] = value
        return result

    def reject_constant(value):
        raise ValueError(f'Niedozwolona wartość JSON: {value}')

    return json.loads(Path(path).read_text(encoding='utf-8'),
                      object_pairs_hook=unique_keys, parse_constant=reject_constant)


def load_schema(path):
    schema = read_json(path)
    try:
        Draft202012Validator.check_schema(schema)
    except SchemaError as error:
        raise ValueError(f'Nieprawidłowy schemat JSON: {error.message}') from error
    return schema


def structure_errors(document, schema):
    errors = []
    for error in Draft202012Validator(schema).iter_errors(document):
        path = '.'.join(map(str, error.absolute_path)) or '$'
        errors.append(f'{path}: {error.message}')
    return errors


def duplicates(values, label, errors):
    for value, count in Counter(values).items():
        if count > 1:
            errors.append(f'{label}: powtórzony identyfikator/wartość {value!r}')


def normalize_answer(value):
    return ' '.join(value.split()).casefold()


def validate_topic(topic, schema):
    errors = structure_errors(topic, schema)
    if errors:
        return errors
    if topic.get('kind') != 'topic':
        return ['Oczekiwano kind=topic']
    lessons = {lesson['id'] for lesson in topic['lessons']}
    tasks = {task['id']: task for task in topic['tasks']}
    duplicates([lesson['id'] for lesson in topic['lessons']], 'lessons', errors)
    duplicates([task['id'] for task in topic['tasks']], 'tasks', errors)
    duplicates([test['id'] for test in topic['tests']], 'tests', errors)
    for task in topic['tasks']:
        label = task['id']
        unknown = set(task['lessonIds']) - lessons
        if unknown:
            errors.append(f'{label}: nieznane lessonIds: {sorted(unknown)}')
        kind = task['type']
        for field in ('items', 'options', 'pairs', 'cards', 'categories'):
            if field in task:
                duplicates([item['id'] for item in task[field]], f'{label}.{field}', errors)
        if kind in ('single-choice', 'multiple-choice'):
            options = {option['id'] for option in task['options']}
            correct = ({task['correctOptionId']} if kind == 'single-choice'
                       else set(task['correctOptionIds']))
            if not correct <= options:
                errors.append(f'{label}: odpowiedź wskazuje nieznaną opcję')
        if kind == 'ordering':
            item_ids = [item['id'] for item in task['items']]
            if len(item_ids) != len(task['correctOrder']) or set(item_ids) != set(task['correctOrder']):
                errors.append(f'{label}: correctOrder musi być pełną permutacją items')
        if kind == 'sorting':
            categories = {category['id'] for category in task['categories']}
            for item in task['items']:
                if item['categoryId'] not in categories:
                    errors.append(f'{label}.{item["id"]}: nieznana kategoria')
        if kind == 'short-answer':
            answers = [normalize_answer(value) for value in task['acceptedAnswers']]
            if not all(answers):
                errors.append(f'{label}: pusta akceptowana odpowiedź')
            duplicates(answers, f'{label}.acceptedAnswers po normalizacji', errors)
    for task_id in topic['learningPath']:
        if task_id not in tasks:
            errors.append(f'learningPath: nieznane zadanie {task_id}')
    anchors = set(topic['learningPath'])
    assigned_variants = set()
    for anchor_id, variant_ids in topic.get('learningVariants', {}).items():
        label = f'learningVariants.{anchor_id}'
        if anchor_id not in anchors:
            errors.append(f'{label}: kotwica nie należy do learningPath')
        anchor = tasks.get(anchor_id)
        for variant_id in variant_ids:
            variant = tasks.get(variant_id)
            if variant is None:
                errors.append(f'{label}: nieznane zadanie {variant_id}')
            if variant_id in anchors:
                errors.append(f'{label}: wariant {variant_id} jest kotwicą learningPath')
            if variant_id in assigned_variants:
                errors.append(f'{label}: powtórzony wariant {variant_id}')
            assigned_variants.add(variant_id)
            if anchor is not None and variant is not None:
                if set(anchor['lessonIds']) != set(variant['lessonIds']):
                    errors.append(f'{label}: wariant {variant_id} ma inne lessonIds niż kotwica')
    graded = {'single-choice', 'multiple-choice', 'matching', 'sorting', 'ordering',
              'short-answer', 'number-answer'}
    for test in topic['tests']:
        duplicates([q['taskId'] for q in test['questions']], test['id'], errors)
        for question in test['questions']:
            task = tasks.get(question['taskId'])
            if task is None:
                errors.append(f'{test["id"]}: nieznane zadanie {question["taskId"]}')
            elif task['type'] not in graded:
                errors.append(f'{test["id"]}: typ {task["type"]} nie jest zadaniem ocenianym')
        if 'draw' in test:
            label = f'{test["id"]}.draw'
            draw_lessons = [group['lessonId'] for group in test['draw']]
            duplicates(draw_lessons, label, errors)
            groups = {lesson_id: [] for lesson_id in draw_lessons}
            for lesson_id in groups:
                if lesson_id not in lessons:
                    errors.append(f'{label}: nieznana lekcja {lesson_id}')
            for question in test['questions']:
                task = tasks.get(question['taskId'])
                if task is None:
                    continue  # The missing reference was reported above.
                matching = set(task['lessonIds']) & groups.keys()
                if len(matching) != 1:
                    errors.append(f'{label}: zadanie {task["id"]} musi należeć do dokładnie jednej grupy')
                    continue
                groups[next(iter(matching))].append(question)
            for group in test['draw']:
                candidates = groups[group['lessonId']]
                if len(candidates) < group['count']:
                    errors.append(f'{label}.{group["lessonId"]}: za mało kandydatów na count={group["count"]}')
                if len({q['points'] for q in candidates}) > 1:
                    errors.append(f'{label}.{group["lessonId"]}: points muszą być jednakowe w grupie')
    nodes = []

    def visit(node):
        nodes.append(node['id'])
        for child in node['children']:
            visit(child)

    visit(topic['mindMap'])
    duplicates(nodes, 'mindMap', errors)
    return errors


def validate_directory(directory):
    root = Path(directory).resolve()
    errors = []
    try:
        schema = load_schema(root / 'content.schema.json')
        catalog = read_json(root / 'catalog.json')
    except (OSError, ValueError) as error:
        return [str(error)]
    errors.extend(structure_errors(catalog, schema))
    if errors:
        return errors
    if catalog.get('kind') != 'catalog':
        return ['catalog.json: oczekiwano kind=catalog']
    duplicates([entry['id'] for entry in catalog['classes']], 'classes', errors)
    duplicates([entry['grade'] for entry in catalog['classes']], 'classes.grade', errors)
    referenced = set()
    for grade in catalog['classes']:
        if grade['id'] != f'klasa-{grade["grade"]}':
            errors.append(f'{grade["id"]}: id klasy nie odpowiada grade')
        duplicates([subject['id'] for subject in grade['subjects']], grade['id'], errors)
        for subject in grade['subjects']:
            duplicates([topic['id'] for topic in subject['topics']], f'{grade["id"]}.{subject["id"]}', errors)
            for entry in subject['topics']:
                path = (root / entry['path']).resolve()
                if not path.is_relative_to(root):
                    errors.append(f'{entry["path"]}: ścieżka poza katalogiem data')
                    continue
                expected = f'{grade["id"]}/{subject["id"]}/{entry["id"]}/topic.json'
                if entry['path'] != expected:
                    errors.append(f'{entry["path"]}: oczekiwano {expected}')
                if path in referenced:
                    errors.append(f'{entry["path"]}: plik wskazany więcej niż raz')
                referenced.add(path)
                try:
                    topic = read_json(path)
                except (OSError, ValueError) as error:
                    errors.append(f'{entry["path"]}: {error}')
                    continue
                topic_errors = validate_topic(topic, schema)
                errors.extend(f'{entry["path"]}: {error}' for error in topic_errors)
                if not topic_errors:
                    for key, expected_value in [('id', entry['id']), ('grade', grade['grade']),
                                                ('subjectId', subject['id']), ('title', entry['title'])]:
                        if topic[key] != expected_value:
                            errors.append(f'{entry["path"]}: {key} różni się od katalogu')
    for path in root.rglob('topic.json'):
        if path.resolve() not in referenced:
            errors.append(f'{path.relative_to(root)}: temat nieobecny w catalog.json')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', nargs='?', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'data')
    args = parser.parse_args()
    errors = validate_directory(args.directory)
    if errors:
        for error in errors:
            print(f'ERROR: {error}', file=sys.stderr)
        return 1
    print(f'OK: katalog, schemat, treści, odpowiedzi i referencje w {args.directory}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
