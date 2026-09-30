# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

## Adding or changing a check

1. Describe the check in docs/checks.md first: what it looks for, its level, and why the next team needs it.
2. Add a test with a small, made-up repository (`fromObject`) where the expected findings can be worked out by hand.
3. A finding names the file when there is one, and says what to do about it.
4. Anything the tool did not read is reported as not read, never as "ok".

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the folder it is given, never follows symbolic links out of it, and writes only when `--output` is given. It opens no network connection.
- A report never repeats a secret it found; it names the file and the kind of secret.
- Fake secrets in tests are built by joining strings, so no file in this repository looks like a real one.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
