# Repository Guidelines

## Project Structure & Module Organization
This repository contains standalone Gemini Live API examples rather than a single app. Use the sample that matches your target stack:

- `gemini-live-genai-python-sdk/`: FastAPI backend (`main.py`, `gemini_live.py`) with a static frontend in `frontend/`.
- `gemini-live-ephemeral-tokens-websocket/`: `aiohttp` server (`server.py`) plus a browser client in `frontend/`.
- `command-line/python/`: minimal Python CLI example.
- `command-line/node/`: minimal Node.js/TypeScript CLI example (`main.mts`).

Keep changes scoped to one example unless you are intentionally updating shared guidance in the root `README.md`.

## Build, Test, and Development Commands
Install and run commands from the relevant subproject directory.

- `uv venv && uv pip install -r requirements.txt`: create a Python environment and install dependencies.
- `uv run main.py`: start the FastAPI SDK example.
- `uv run server.py`: start the ephemeral-token WebSocket example.
- `python main.py`: run the Python CLI sample after installing dependencies.
- `npm install`: install Node CLI dependencies in `command-line/node/`.
- `npx tsx main.mts`: run the Node CLI sample.
- `npx tsc --noEmit`: type-check the Node example using `tsconfig.json`.

## Coding Style & Naming Conventions
Follow the existing style in each sample:

- Python: 4-space indentation, `snake_case` for functions and variables, `UPPER_SNAKE_CASE` for environment-driven constants.
- JavaScript/TypeScript: 2-space to 4-space indentation is already mixed across examples; preserve the surrounding file’s style instead of reformatting unrelated code.
- Keep frontend files framework-free and modular. Use descriptive names such as `media-handler.js`, `gemini-client.js`, and `tools.js`.

Do not introduce new build tools or formatters unless the sample already uses them.

## Testing Guidelines
There is no automated test suite in the repository today. Validate changes with targeted smoke tests:

- Start the modified server or CLI locally.
- Confirm `.env` contains `GEMINI_API_KEY`.
- For browser samples, verify `http://localhost:8000` loads and that audio/video connection flow still works.
- For `command-line/node`, run `npx tsc --noEmit` before submitting.

If you add tests, place them next to the sample they cover and name them clearly, for example `test_token_endpoint.py`.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style, for example `feat: ...` and `chore(deps): ...`. Use concise, imperative commit subjects and include scope when helpful.

Pull requests should state which sample was changed, how it was verified, and any required environment or API-key setup. Include screenshots or terminal output when UI or connection behavior changes.
