# English Eval Cases

English evaluation cases will be added here, mirroring the Chinese cases in `../zh/` with identical test logic but English prompts.

## Structure

```
en/
├── single_agent/
│   ├── info_processor.json
│   ├── macro_analyst.json
│   ├── technical_analyst.json
│   └── reviewer.json
└── workflow/
    └── financial_manager.json
```

Each test case should have the same `test_id` and `expected_behavior` as its Chinese counterpart, only the `input_prompt` differs.
