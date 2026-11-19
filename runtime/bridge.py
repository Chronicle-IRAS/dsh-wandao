"""Private package-local manifest executor. One JSON request arrives over stdin.

Credentials and argv are transported inside that request, not the OS command line.
The remaining stdin stays open for interactive login confirmation.
"""
from __future__ import annotations

import json
import hashlib
import os
import re
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PRIVATE = re.compile(r"password|secret|cookie|token|api.?key|client.?id|app.?id|username|oauth_client", re.I)


def within(root: Path, target: Path) -> bool:
    return target == root or root in target.parents


def providers():
    found = {}
    for manifest in sorted((ROOT / 'plugins').glob('*/plugin.json')):
        plugin = json.loads(manifest.read_text(encoding='utf-8'))
        plugin_root = manifest.parent.resolve()
        for relative in plugin.get('entrypoints', {}).get('providers', []):
            source = (plugin_root / relative).resolve()
            if not within(plugin_root, source):
                raise ValueError('Invalid bundled provider path')
            provider = json.loads(source.read_text(encoding='utf-8'))
            found[provider['id']] = (provider, plugin, source)
    return found


def supported(plugin):
    platforms = plugin.get('platforms') or []
    return not platforms or sys.platform in platforms


def field_applies(field, action):
    return not field.get('actions') or action['id'] in field['actions']


def private(field):
    return field.get('type') == 'password' or bool(PRIVATE.search(field.get('name', '')))


def real_absolute(value):
    target = Path(value)
    if not target.is_absolute():
        raise ValueError('Use absolute filesystem paths')
    return target.resolve()


def reject_links(target):
    if not target.exists():
        return
    for item in target.rglob('*'):
        if item.is_symlink() or (hasattr(item, 'is_junction') and item.is_junction()):
            raise ValueError('Output contains a symbolic link')
        if item.is_file() and item.stat().st_nlink > 1:
            raise ValueError('Output contains a hard link')


def prepare(request, provider, plugin, source):
    action = next((a for a in provider.get('actions', []) if a['id'] == request.get('actionId')), None)
    if not action:
        raise ValueError('Unknown actionId')
    if not supported(plugin):
        raise ValueError('Provider does not support this operating system')
    if (action.get('kind') == 'import' or action.get('danger') or action.get('confirm')) and request.get('confirmWrite') is not True:
        raise ValueError('Remote write confirmation is required (confirmWrite=true)')
    script = (source.parent / (action.get('script') or provider.get('script', ''))).resolve()
    if not within(source.parents[2], script) or script.suffix != '.py' or not script.is_file():
        raise ValueError('Invalid bundled action script')
    fields = {f['name']: f for f in provider.get('fields', []) if f.get('arg') and field_applies(f, action)}
    supplied = request.get('fields') or {}
    if not isinstance(supplied, dict):
        raise ValueError('fields must be an object')
    for key in supplied:
        if key not in fields:
            raise ValueError('Unknown field: ' + key)
        if private(fields[key]):
            raise ValueError('Credential fields must be supplied in private settings, not tool arguments')
    config = request['config']
    data_root = real_absolute(config['dataDir'])
    data = data_root / plugin['id']
    data.mkdir(parents=True, exist_ok=True, mode=0o700)
    settings_path = data / 'settings.json'
    settings = json.loads(settings_path.read_text(encoding='utf-8')) if settings_path.exists() else {}
    if not isinstance(settings, dict):
        raise ValueError('Private settings must be an object')
    args = [str(v) for v in action.get('args', [])]
    sources = []
    outputs = []
    for name, field in fields.items():
        value = settings.get(name, field.get('default'))
        if name in supplied:
            value = supplied[name]
        if value is None or value == '':
            if field.get('required'):
                raise ValueError('Required field missing: ' + name)
            continue
        kind = field.get('type')
        if kind == 'checkbox':
            if not isinstance(value, bool):
                raise ValueError('Checkbox must be boolean: ' + name)
            flag = field['arg'] if value else field.get('falseArg')
            if flag:
                args.append(flag)
            continue
        if kind == 'number':
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError('Numeric field required: ' + name)
            if value < field.get('min', float('-inf')) or value > field.get('max', float('inf')):
                raise ValueError('Numeric field is out of range: ' + name)
        else:
            if not isinstance(value, str) or '\x00' in value:
                raise ValueError('String field required: ' + name)
            if kind == 'select':
                choices = [v.get('value') if isinstance(v, dict) else v for v in field.get('options', [])]
                dynamic = any(update.get('field') == name and update.get('type') == 'options'
                              for candidate in provider.get('actions', []) for update in candidate.get('updates', []))
                # Desktop fills these options from a prior targets action; DSH
                # passes the returned target ID explicitly instead of keeping UI state.
                if value not in choices and not (dynamic and not choices):
                    raise ValueError('Invalid selection: ' + name)
        if kind in ('directory', 'file'):
            target = real_absolute(value)
            is_output = field['arg'] in ('--output', '--output-dir')
            if is_output:
                if not within(real_absolute(config['outputRoot']), target):
                    raise ValueError('Destination is outside configured outputRoot')
                reject_links(target)
                outputs.append(target)
            else:
                roots = [real_absolute(root) for root in config['vaultRoots']] + [data_root]
                if not any(within(root, target) for root in roots):
                    raise ValueError('Path is outside allowed source roots')
                if not target.exists():
                    raise ValueError('Source path does not exist')
                sources.append(target)
            value = str(target)
        args.append(field['arg'] + '=' + str(value))
    if any(within(src, dst) or within(dst, src) for src in sources for dst in outputs):
        raise ValueError('Source and output paths must not overlap')
    if 'docIds' in request:
        ids = request['docIds']
        if not isinstance(ids, list) or not ids or not all(isinstance(v, str) and v and '\x00' not in v for v in ids):
            raise ValueError('Document selection must be a non-empty list')
        if action.get('includeSelection') is False:
            raise ValueError('This action does not accept document selection')
        flag = provider.get('toc', {}).get('selectionArg', '--doc-id')
        args.extend(provider.get('toc', {}).get('selectionPrefixArgs', []))
        args.extend(flag + '=' + value for value in ids)
    checkpoint = provider.get('checkpoint', {}).get('supported') and action.get('kind') in ('export', 'import')
    if request.get('resume') and not checkpoint:
        raise ValueError('This provider action does not support checkpoint resume')
    if checkpoint:
        # Scope is stable across tuning/retry changes, separate across sources and destinations.
        identity = {k: v for k, v in supplied.items() if isinstance(v, str) and not private(fields[k])}
        digest = hashlib.sha256(json.dumps([provider['id'], action['id'], identity], sort_keys=True).encode()).hexdigest()[:32]
        args.extend(['--checkpoint-file=' + str(data / 'checkpoint.sqlite'), '--checkpoint-task-id=' + digest])
        if request.get('resume'):
            args.append('--resume')
    os.environ.update({
        'WANDAO_DATA_DIR': str(data), 'WANDAO_PLUGIN_DATA_DIR': str(data),
        'WANDAO_PLUGIN_ID': plugin['id'], 'WANDAO_PROVIDER_ID': provider['id'],
        'WANDAO_STRUCTURED_LOGS': '1',
    })
    if config.get('browser'):
        os.environ['WANDAO_BROWSER'] = config['browser']
    if '--password-stdin' in args:
        # The backend reads exactly one line. A private environment variable avoids
        # mixing its password with the interactive confirmation channel.
        if not isinstance(settings.get('password'), str):
            raise ValueError('Set password in private settings before initializing authentication')
        args.remove('--password-stdin')
        os.environ['WANDAO_LOGIN_PASSWORD'] = settings['password']
        args.extend(['--password-env', 'WANDAO_LOGIN_PASSWORD'])
    return script, args


def main():
    request = json.loads(sys.stdin.readline())
    catalogue = providers()
    if request['op'] == 'providers':
        print(json.dumps({'providers': [{
            'id': p['id'], 'title': p.get('title', p['id']),
            'loginRequired': bool(p.get('capabilities', {}).get('login')),
            'supported': supported(plugin), 'platforms': plugin.get('platforms') or [],
            'actions': [a['id'] for a in p.get('actions', [])],
        } for p, plugin, _ in catalogue.values()]}, ensure_ascii=False))
        return
    if request.get('providerId') not in catalogue:
        raise ValueError('Unknown providerId')
    provider, plugin, source = catalogue[request['providerId']]
    password_actions = [a['id'] for a in provider.get('actions', []) if '--password-stdin' in a.get('args', [])]
    if request['op'] == 'saveSettings':
        from wandao_core.credentials import write_private_json
        supplied = request.get('fields')
        allowed = {f['name'] for f in provider.get('fields', []) if f.get('arg') and private(f)}
        if password_actions:
            allowed.add('password')
        if not isinstance(supplied, dict) or any(k not in allowed or not isinstance(v, str) or '\x00' in v for k, v in supplied.items()):
            raise ValueError('Only declared private text fields can be saved')
        target = real_absolute(request['config']['dataDir']) / plugin['id'] / 'settings.json'
        settings = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}
        settings.update({k: v for k, v in supplied.items() if v != ''})
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        write_private_json(target, settings)
        print(json.dumps({'saved': True}))
        return
    if request['op'] == 'describe':
        guide = ''
        if provider.get('guide'):
            guide_path = (source.parent / provider['guide']).resolve()
            if within(source.parents[2], guide_path) and guide_path.is_file():
                guide = guide_path.read_text(encoding='utf-8')[:16000]
        print(json.dumps({
            'providerId': provider['id'], 'pluginId': plugin['id'], 'title': provider.get('title', provider['id']), 'description': provider.get('description', ''), 'guide': guide,
            'fields': [{**{k: v for k, v in f.items() if k in ('name', 'label', 'type', 'required', 'actions', 'options', 'min', 'max') or (k == 'default' and not private(f))}, 'private': private(f)} for f in provider.get('fields', []) if f.get('arg')] + ([{'name': 'password', 'label': '印象笔记密码', 'type': 'password', 'private': True, 'actions': password_actions}] if password_actions else []),
            'actions': [{k: v for k, v in a.items() if k in ('id', 'kind', 'label', 'confirm', 'danger', 'includeSelection', 'updates')} for a in provider.get('actions', [])],
            'toc': provider.get('toc', {}),
            'checkpoint': provider.get('checkpoint', {}), 'requirements': provider.get('requirements', {}),
            'capabilities': provider.get('capabilities', {}), 'retryFailures': provider.get('retryFailures', {}),
        }, ensure_ascii=False))
        return
    if request['op'] != 'execute':
        raise ValueError('Unknown bridge operation')
    script, args = prepare(request, provider, plugin, source)
    sys.argv = [str(script), *args]
    # Match direct script execution: sibling backend modules and shared modules
    # resolve solely from files shipped in this package.
    sys.path[:0] = [str(script.parent), str(ROOT)]
    runpy.run_path(str(script), run_name='__main__')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError) as error:
        # Never include backend argument values or private settings in errors.
        print(json.dumps({'bridgeError': str(error)}))
        sys.exit(2)
