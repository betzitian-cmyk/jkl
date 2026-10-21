import openai

class SambaNova(openai.OpenAI):
    def __init__(self, api_key: str = "e16db853-d3ba-4eb9-9e70-0846ca054b6a", base_url: str = "https://api.sambanova.ai/v1", **kwargs):
        super().__init__(api_key=api_key, base_url=base_url, **kwargs)
