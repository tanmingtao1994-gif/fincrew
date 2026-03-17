import os
import re

def fix_imports(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') and 'node_modules' not in root:
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Regex to match relative imports without extension
                # Matches: from './foo' or from '../foo/bar'
                # Does NOT match: from './foo.js' or from 'package'
                new_content = re.sub(
                    r"(from\s+['\"])(\.{1,2}/[^'\"]+)(['\"];?)",
                    lambda m: f"{m.group(1)}{m.group(2)}.ts{m.group(3)}" if not m.group(2).endswith(('.ts', '.js', '.json')) else m.group(0),
                    content
                )
                
                if new_content != content:
                    print(f"Fixing {filepath}")
                    with open(filepath, 'w') as f:
                        f.write(new_content)

fix_imports('src')
