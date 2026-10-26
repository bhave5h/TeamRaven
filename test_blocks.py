import os, anthropic
from dotenv import load_dotenv
load_dotenv('b:/Ragnarok/teamraven/backend/.env')
client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
r = client.messages.create(
    model='claude-sonnet-5',
    max_tokens=200,
    system='You must return valid JSON only.',
    messages=[{'role': 'user', 'content': 'output {"test": 123}'}]
)
print('Content length:', len(r.content))
for i, b in enumerate(r.content):
    print(f'Block {i}: {type(b)}')
    if hasattr(b, 'text'):
        print(f'Block {i} text: {b.text!r}')
    if hasattr(b, 'thinking'):
        print(f'Block {i} thinking: {b.thinking[:50]!r}')
