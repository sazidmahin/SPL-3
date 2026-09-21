# SrsGen Qwen-1.5 Artifact Directory

This directory is intentionally committed without model weights. Train Qwen-1.5 with QLoRA externally (for example, on Kaggle), then upload the Hugging Face artifacts using this layout:

```text
srsgen-qwen1.5/
|-- base_model/
|   |-- config.json
|   |-- tokenizer files
|   `-- model weight files
`-- lora_adapter/
    |-- adapter_config.json
    `-- adapter_model.safetensors
```

The backend loads the base model only from `base_model/` and attaches the PEFT adapter from `lora_adapter/`. It does not train or download a model.

Install only the inference dependencies in the GPU runtime:

```bash
pip install -r requirements-srsgen-runtime.txt
```

Do not commit model weights or private training data to source control.
