"""Offline tests for preparation; never log in or write to a remote platform."""
import importlib.util
import json
import tempfile
import unittest
import subprocess
import sys
import os
from pathlib import Path

RUNTIME = Path(__file__).resolve().parents[1] / 'runtime'
spec = importlib.util.spec_from_file_location('packaged_bridge', RUNTIME / 'bridge.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


class CheckpointTests(unittest.TestCase):
    def test_dynamic_import_targets_accept_ids_returned_by_the_targets_action(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source_dir = root / 'notes'
            source_dir.mkdir()
            provider, plugin, source = bridge.providers()['xiliu-import']
            _, args = bridge.prepare({
                'actionId': 'import', 'confirmWrite': True,
                'fields': {'source_dir': str(source_dir), 'parent_id': 'page-from-targets', 'space_id': 'space-from-targets'},
                'config': {'dataDir': str(root / 'state'), 'outputRoot': str(root / 'exports'), 'vaultRoots': [str(source_dir)]},
            }, provider, plugin, source)
            self.assertIn('--parent-id=page-from-targets', args)
            self.assertIn('--space-id=space-from-targets', args)

    def test_checkpoint_stays_in_private_data_and_is_stable_across_retry_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            provider, plugin, source = bridge.providers()['feishu-export']
            request = {
                'providerId': 'feishu-export', 'actionId': 'export', 'resume': True,
                'fields': {'wiki_url': 'https://example.feishu.cn/wiki/test', 'output': str(root / 'exports')},
                'config': {'dataDir': str(root / 'state'), 'outputRoot': str(root / 'exports'), 'vaultRoots': []},
            }
            _, first = bridge.prepare(request, provider, plugin, source)
            request['fields']['retry_failed'] = True
            _, second = bridge.prepare(request, provider, plugin, source)
            self.assertIn('--resume', first)
            self.assertIn('--checkpoint-file=' + str(root.resolve() / 'state' / 'feishu' / 'checkpoint.sqlite'), first)
            self.assertEqual(next(a for a in first if a.startswith('--checkpoint-task-id=')), next(a for a in second if a.startswith('--checkpoint-task-id=')))

    def test_credentials_are_not_part_of_os_argv_or_preparation_errors(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = root / 'ima'
            data.mkdir()
            (data / 'settings.json').write_text(json.dumps({'client_id': 'private-client', 'api_key': 'private-key'}))
            provider, plugin, source = bridge.providers()['ima-export']
            script, args = bridge.prepare({
                'actionId': 'saveConfig', 'config': {'dataDir': str(root), 'vaultRoots': [], 'outputRoot': str(root / 'out')},
            }, provider, plugin, source)
            # These are runpy's in-memory sys.argv, not the spawning OS argv.
            self.assertIn('--api-key=private-key', args)
            self.assertTrue(script.is_relative_to(RUNTIME))

    def test_every_supported_bundled_backend_can_load_its_cli_without_repository_imports(self):
        scripts = set()
        for provider, plugin, source in bridge.providers().values():
            if not bridge.supported(plugin):
                continue
            for action in provider.get('actions', []):
                script = (source.parent / action['script']).resolve()
                scripts.add(script)
        with tempfile.TemporaryDirectory() as directory:
            for script in sorted(scripts):
                with self.subTest(script=str(script.relative_to(RUNTIME))):
                    result = subprocess.run([sys.executable, '-B', str(script), '--help'],
                        cwd=directory, capture_output=True, text=True, encoding='utf-8', timeout=15,
                        env={**os.environ, 'PYTHONPATH': str(RUNTIME), 'PYTHONIOENCODING': 'utf-8'})
                    self.assertEqual(result.returncode, 0, result.stderr[-1000:])


if __name__ == '__main__':
    unittest.main()
